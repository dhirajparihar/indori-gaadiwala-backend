const express = require('express');
const router = express.Router();
const SellerInquiry = require('../models/SellerInquiry');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const axios = require('axios');

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (filePath, folder = 'seller-inquiries') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto'
        });
        // Delete local file after upload
        fs.unlinkSync(filePath);
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        // Delete local file even on error
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw error;
    }
};

// Helper function to fetch vehicle details
const fetchVehicleDetails = async (regNo) => {
    try {
        const response = await axios.get(
            `${process.env.CAR_URL}/${regNo}`,
            {
                timeout: 15000,
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'authorization': `Basic ${process.env.CAR_API_KEY}`,
                    'device_category': 'WebApp',
                    'origin': 'https://www.cars24.com',
                    'origin_source': 'c2b-website',
                    'platform': 'seller',
                    'referer': 'https://www.cars24.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
                }
            }
        );

        if (response.data && response.data.success && response.data.detail) {
            const d = response.data.detail;
            const variant = d.ds_details?.[0]?.variant || {};

            return {
                // Basic Info
                make: d.brand?.make_display || '',
                model: d.model?.model_display || '',
                variant: variant.variant_name || '',
                variantDisplayName: variant.variant_display_name || '',
                year: d.year?.year || '',
                regnYear: d.regn_year || '',
                color: d.color || '',
                bodyType: d.model?.bodyType || '',

                // Fuel & Transmission
                fuelType: variant.fuel_type || d.fuelType || '',
                rawFuelType: d.rawFuelType || '',
                transmissionType: variant.transmission_type || '',

                // Registration Details
                registeredPlace: d.registeredPlace || '',
                registeredAt: d.registeredAt || '',
                vehicleCategory: d.vehicleCategory || '',
                vehicleClassDesc: d.vehicleClassDesc || '',
                rcModel: d.rc_model || '',
                rcStatus: d.rcStatus || '',
                rcOwnerCount: d.rc_owner_sr || '',
                rcOwnerNameMasked: d.rc_owner_name_masked || '',

                // Insurance & Fitness
                insuranceCompany: d.insuranceCompany || '',
                insuranceUpTo: d.insuranceUpTo || '',
                fitnessUpTo: d.fitnessUpTo || '',
                pucUpTo: d.pucUpTo || '',
                taxUpTo: d.taxUpTo || '',

                // Finance
                hypothecation: d.hypothecation || false,
                financier: d.financier || '',
                rtoNocIssued: d.rtoNocIssued || '',

                // Manufacturing
                manufacturingMonthYr: d.manufacturingMonthYr || '',
                unladenWt: d.unladenWt || '',
                seatCap: d.seatCap || ''
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching vehicle details:', error.message);
        return null;
    }
};


// Lookup vehicle by registration number (protected - admin only)
router.get('/lookup/:regNo', authMiddleware, async (req, res) => {
    try {
        const regNo = req.params.regNo.toUpperCase().replace(/\s+/g, '');

        if (!regNo) {
            return res.status(400).json({
                success: false,
                message: 'Registration number is required'
            });
        }

        const vehicleDetails = await fetchVehicleDetails(regNo);

        if (!vehicleDetails) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle details not found for this registration number'
            });
        }

        res.json({
            success: true,
            data: {
                regNo,
                ...vehicleDetails
            }
        });
    } catch (error) {
        console.error('Error looking up vehicle:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Lookup vehicle public (NO AUTH)
router.get('/public-lookup/:regNo', async (req, res) => {
    try {
        const regNo = req.params.regNo.toUpperCase().replace(/\s+/g, '');

        if (!regNo) {
            return res.status(400).json({
                success: false,
                message: 'Registration number is required'
            });
        }

        const vehicleDetails = await fetchVehicleDetails(regNo);

        if (!vehicleDetails) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle details not found'
            });
        }

        res.json({
            success: true,
            data: {
                regNo,
                ...vehicleDetails
            } // Security: fetchVehicleDetails already masks sensitive info like owner name
        });
    } catch (error) {
        console.error('Error looking up vehicle:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Create a new seller inquiry (public)
router.post('/', upload.fields([
    { name: 'photo', maxCount: 5 },
    { name: 'rcCard', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, phone, regNo, kmDriven, demand } = req.body;

        // Validate required fields
        if (!name || !phone || !regNo || !kmDriven || !demand) {
            return res.status(400).json({
                success: false,
                message: 'Name, phone, registration number, KM driven, and demand are required'
            });
        }

        // Format registration number: uppercase, no spaces
        const formattedRegNo = regNo.toUpperCase().replace(/\s+/g, '');

        // Create seller inquiry immediately (fast response)
        const inquiry = await SellerInquiry.create({
            name,
            phone,
            regNo: formattedRegNo,
            kmDriven: Number(kmDriven),
            demand: Number(demand)
        });

        // Send response immediately - don't wait for image upload or API call
        res.status(201).json({
            success: true,
            message: 'Seller inquiry submitted successfully',
            data: inquiry,
            vehicleDetailsFound: false // Will be updated in background
        });

        // Now handle images and vehicle details in background (non-blocking)
        setImmediate(async () => {
            try {
                let photoUrls = [];
                let rcCardUrl = '';

                // Upload images to Cloudinary if provided
                if (req.files) {
                    // Handle multiple photos
                    if (req.files['photo'] && req.files['photo'].length > 0) {
                        for (const photoFile of req.files['photo']) {
                            const url = await uploadToCloudinary(photoFile.path);
                            photoUrls.push(url);
                        }
                    }
                    if (req.files['rcCard'] && req.files['rcCard'][0]) {
                        rcCardUrl = await uploadToCloudinary(req.files['rcCard'][0].path);
                    }
                }

                // Fetch vehicle details from CardDekho API
                const vehicleDetails = await fetchVehicleDetails(formattedRegNo);

                // Update the inquiry with additional data
                await SellerInquiry.findByIdAndUpdate(inquiry._id, {
                    photos: photoUrls,
                    rcCard: rcCardUrl,
                    ...(vehicleDetails || {})
                });

                console.log(`✅ Updated seller inquiry ${inquiry._id} with vehicle details`);
            } catch (error) {
                console.error('Background processing error:', error.message);
            }
        });

    } catch (error) {
        console.error('Error creating seller inquiry:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all seller inquiries (protected - admin only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const inquiries = await SellerInquiry.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            count: inquiries.length,
            data: inquiries
        });
    } catch (error) {
        console.error('Error fetching seller inquiries:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get single seller inquiry (protected - admin only)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const inquiry = await SellerInquiry.findById(req.params.id);

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                message: 'Seller inquiry not found'
            });
        }

        res.json({
            success: true,
            data: inquiry
        });
    } catch (error) {
        console.error('Error fetching seller inquiry:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update seller inquiry status (protected - admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const inquiry = await SellerInquiry.findByIdAndUpdate(
            req.params.id,
            { status, notes },
            { new: true }
        );

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                message: 'Seller inquiry not found'
            });
        }

        res.json({
            success: true,
            data: inquiry
        });
    } catch (error) {
        console.error('Error updating seller inquiry:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete seller inquiry (protected - admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const inquiry = await SellerInquiry.findByIdAndDelete(req.params.id);

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                message: 'Seller inquiry not found'
            });
        }

        res.json({
            success: true,
            message: 'Seller inquiry deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting seller inquiry:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
