const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new lead (public - from welcome popup)
router.post('/', async (req, res) => {
    try {
        const { name, phone, source } = req.body;

        // Check if lead with same phone already exists
        const existingLead = await Lead.findOne({ phone });

        if (existingLead) {
            // Update existing lead with new visit timestamp
            existingLead.updatedAt = new Date();
            await existingLead.save();
            return res.status(200).json({
                success: true,
                message: 'Lead already exists, updated timestamp',
                data: existingLead
            });
        }

        const lead = await Lead.create({
            name,
            phone,
            source: source || 'welcome_popup'
        });

        res.status(201).json({
            success: true,
            message: 'Lead created successfully',
            data: lead
        });
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all leads (protected - admin only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            count: leads.length,
            data: leads
        });
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update lead status (protected - admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            { status, notes },
            { new: true }
        );

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        res.json({
            success: true,
            data: lead
        });
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete lead (protected - admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const lead = await Lead.findByIdAndDelete(req.params.id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        res.json({
            success: true,
            message: 'Lead deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting lead:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
