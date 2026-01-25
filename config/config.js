require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://dhirajparihar2001_db_user:2prDIq8PWWVPZnNd@cluster0.krk61d1.mongodb.net/indori-gaadiwala',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    NODE_ENV: process.env.NODE_ENV || 'development',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
};
