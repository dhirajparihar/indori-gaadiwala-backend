const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Vehicle = require('../models/Vehicle');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/cloudinaryMiddleware');
const cloudinary = require('../config/cloudinary');

// @route   GET /api/vehicles
// @desc    Get all vehicles with filters
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { type, minPrice, maxPrice, brand, fuelType, transmission, status, featured } = req.query;

        // Build filter object
        let filter = {};

        if (type) filter.type = type;
        if (brand) filter.brand = new RegExp(brand, 'i');
        if (fuelType) filter.fuelType = fuelType;
        if (transmission) filter.transmission = transmission;
        if (status) filter.status = status;
        if (featured) filter.featured = featured === 'true';

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice && !isNaN(minPrice)) filter.price.$gte = Number(minPrice);
            if (maxPrice && !isNaN(maxPrice)) filter.price.$lte = Number(maxPrice);
        }

        const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: vehicles.length,
            data: vehicles
        });
    } catch (error) {
        console.error('Get vehicles error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/vehicles/:id
// @desc    Get single vehicle
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        res.json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        console.error('Get vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/vehicles
// @desc    Create new vehicle
// @access  Private (Admin)
router.post('/',
    authMiddleware,
    upload.array('images', 10),
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('type').isIn(['car', 'bike', 'commercial']).withMessage('Type must be car, bike or commercial'),
        body('brand').notEmpty().withMessage('Brand is required'),
        body('model').notEmpty().withMessage('Model is required'),
        body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
        body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
        body('originalPrice').isFloat({ min: 0 }).withMessage('Valid original price is required'),
        body('mileage').notEmpty().withMessage('Mileage is required'),
        body('fuelType').isIn(['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG']).withMessage('Valid fuel type is required'),
        body('transmission').isIn(['Manual', 'Automatic', 'Semi-Automatic']).withMessage('Valid transmission is required'),
        body('description').notEmpty().withMessage('Description is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            // Get Cloudinary image URLs
            const images = req.files ? req.files.map(file => file.path) : [];

            // Parse features if it's a string
            let features = req.body.features;
            if (typeof features === 'string') {
                try {
                    features = JSON.parse(features);
                } catch (e) {
                    features = features.split(',').map(f => f.trim());
                }
            }

            const vehicleData = {
                ...req.body,
                images,
                features: features || []
            };

            const vehicle = new Vehicle(vehicleData);
            await vehicle.save();

            res.status(201).json({
                success: true,
                message: 'Vehicle created successfully',
                data: vehicle
            });
        } catch (error) {
            console.error('Create vehicle error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
);

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle
// @access  Private (Admin)
router.put('/:id',
    authMiddleware,
    upload.array('images', 10),
    async (req, res) => {
        try {
            let vehicle = await Vehicle.findById(req.params.id);

            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    message: 'Vehicle not found'
                });
            }

            // Get new Cloudinary image URLs if uploaded
            const newImages = req.files ? req.files.map(file => file.path) : [];

            // Parse features if it's a string
            let features = req.body.features;
            if (typeof features === 'string') {
                try {
                    features = JSON.parse(features);
                } catch (e) {
                    features = features.split(',').map(f => f.trim());
                }
            }

            // Update vehicle data
            const updateData = {
                ...req.body,
                features: features || vehicle.features
            };

            // If new images uploaded, add them to existing images
            if (newImages.length > 0) {
                updateData.images = [...(vehicle.images || []), ...newImages];
            }

            vehicle = await Vehicle.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true, runValidators: true }
            );

            res.json({
                success: true,
                message: 'Vehicle updated successfully',
                data: vehicle
            });
        } catch (error) {
            console.error('Update vehicle error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
);

// @route   DELETE /api/vehicles/:id
// @desc    Delete vehicle
// @access  Private (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        console.log('🗑️  DELETE request received for vehicle ID:', req.params.id);
        console.log('👤 User:', req.user?.email);

        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            console.log('❌ Vehicle not found:', req.params.id);
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        console.log('✅ Vehicle found, deleting:', vehicle.title);

        // Delete images from Cloudinary
        if (vehicle.images && vehicle.images.length > 0) {
            console.log('🖼️  Deleting', vehicle.images.length, 'images from Cloudinary');
            for (const imageUrl of vehicle.images) {
                try {
                    // Extract public_id from Cloudinary URL
                    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/filename.jpg
                    const urlParts = imageUrl.split('/');
                    const publicIdWithExt = urlParts.slice(-2).join('/');
                    const publicId = publicIdWithExt.split('.')[0];

                    await cloudinary.uploader.destroy(publicId);
                    console.log('✅ Deleted image:', publicId);
                } catch (imgError) {
                    console.error('⚠️  Error deleting image:', imgError.message);
                    // Continue with vehicle deletion even if image deletion fails
                }
            }
        }

        await Vehicle.findByIdAndDelete(req.params.id);
        console.log('✅ Vehicle deleted successfully from database');

        res.json({
            success: true,
            message: 'Vehicle deleted successfully'
        });
    } catch (error) {
        console.error('Delete vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
