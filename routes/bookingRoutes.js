const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/bookings
// @desc    Create new booking/contact
// @access  Public
router.post('/',
    [
        body('vehicle').notEmpty().withMessage('Vehicle ID is required'),
        body('customerName').notEmpty().withMessage('Name is required'),
        body('customerEmail').isEmail().withMessage('Valid email is required'),
        body('customerPhone').notEmpty().withMessage('Phone number is required')
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

            const booking = new Booking(req.body);
            await booking.save();

            // Populate vehicle details
            await booking.populate('vehicle');

            res.status(201).json({
                success: true,
                message: 'Booking request submitted successfully! We will contact you soon.',
                data: booking
            });
        } catch (error) {
            console.error('Create booking error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
);

// @route   GET /api/bookings
// @desc    Get all bookings
// @access  Private (Admin)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status } = req.query;

        let filter = {};
        if (status) filter.status = status;

        const bookings = await Booking.find(filter)
            .populate('vehicle')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private (Admin)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('vehicle');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking status
// @access  Private (Admin)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        booking = await Booking.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('vehicle');

        res.json({
            success: true,
            message: 'Booking updated successfully',
            data: booking
        });
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/bookings/:id
// @desc    Delete booking
// @access  Private (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        await Booking.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
