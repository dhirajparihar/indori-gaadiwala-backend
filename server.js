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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
if (!config.MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing in config!');
    console.error('Please verify Railway Variables contain MONGODB_URI (or MONGO_URL / MONGODB_URL / DATABASE_URL)');
    const mongoEnvKeys = Object.keys(process.env).filter((k) => /mongo|db|database/i.test(k));
    console.error(`DEBUG: env keys containing mongo/db: ${mongoEnvKeys.join(', ') || '(none)'}`);
    process.exit(1);
}

const startServer = async () => {
    try {
        await mongoose.connect(config.MONGODB_URI);
        console.log('✅ MongoDB connected successfully');

        // Start server
        const PORT = config.PORT;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Environment: ${config.NODE_ENV}`);
            console.log(`🌐 API URL: http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/seller-inquiries', sellerInquiryRoutes);

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

startServer();

module.exports = app;
