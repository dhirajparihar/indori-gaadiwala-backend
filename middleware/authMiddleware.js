const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        console.log('🔐 Auth check for:', req.method, req.path);
        console.log('🎫 Token present:', !!token);

        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({
                success: false,
                message: 'No authentication token, access denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, config.JWT_SECRET);
        console.log('✅ Token verified for user ID:', decoded.id);

        // Find user
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            console.log('❌ User not found for ID:', decoded.id);
            return res.status(401).json({
                success: false,
                message: 'User not found, token invalid'
            });
        }

        console.log('✅ User authenticated:', user.email);
        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        console.log('❌ Auth error:', error.message);
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};

module.exports = authMiddleware;
