const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const config = require('../config/config');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register new admin (protected - only for superadmin)
// @access  Private
router.post('/register',
    authMiddleware,
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('name').notEmpty().withMessage('Name is required')
    ],
    async (req, res) => {
        try {
            // Check if user is superadmin
            if (req.user.role !== 'superadmin') {
                return res.status(403).json({
                    success: false,
                    message: 'Only superadmin can create new admins'
                });
            }

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { email, password, name, role } = req.body;

            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Create new user
            user = new User({
                email,
                password,
                name,
                role: role || 'admin'
            });

            await user.save();

            res.status(201).json({
                success: true,
                message: 'Admin created successfully',
                data: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
);

// @route   POST /api/auth/login
// @desc    Login admin
// @access  Public
router.post('/login',
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').notEmpty().withMessage('Password is required')
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

            const { email, password } = req.body;

            // Check if user exists
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Create JWT token
            const token = jwt.sign(
                { id: user._id },
                config.JWT_SECRET,
                { expiresIn: config.JWT_EXPIRE }
            );

            // Set HTTP-only cookie with token
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    user: {
                        id: user._id,
                        email: user.email,
                        name: user.name,
                        role: user.role
                    }
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
);

// @route   GET /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.get('/verify', authMiddleware, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user._id,
                    email: req.user.email,
                    name: req.user.name,
                    role: req.user.role
                }
            }
        });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
