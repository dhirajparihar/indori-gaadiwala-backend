const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');

// Import routes
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const leadRoutes = require('./routes/leadRoutes');
const sellerInquiryRoutes = require('./routes/sellerInquiryRoutes');

// Initialize express app
const app = express();

// Middleware
app.use(cors({
    origin: [
        'https://gaadiwala-nextjs.vercel.app',
        'https://indori-gaadiwala.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/seller-inquiries', sellerInquiryRoutes);

// Root route for debugging
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Gaadiwala API is running',
        endpoints: {
            health: '/api/health',
            vehicles: '/api/vehicles',
            auth: '/api/auth',
            bookings: '/api/bookings',
            leads: '/api/leads',
            sellerInquiries: '/api/seller-inquiries'
        }
    });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Gaadiwala API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${config.NODE_ENV}`);
    console.log(`🌐 API URL: http://localhost:${PORT}`);
});

module.exports = app;
