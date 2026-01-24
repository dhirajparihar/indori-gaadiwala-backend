const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const config = require('./config/config');


async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.MONGODB_URI);
        console.log('✅ Connected to MongoDB');


        // Create admin user
        const adminUser = new User({
            email: 'vishal@gaadiwala.com',
            password: 'admin@3344',
            name: 'Vishal',
            role: 'superadmin'
        });
        await adminUser.save();
        console.log('👤 Created admin user');
        console.log('   Email: admin@gaadiwala.com');
        console.log('   Password: admin@3344');

       
        console.log('\n✨ Database seeded successfully!');
        console.log('\n📝 You can now:');
        console.log('   1. Start the backend server: npm start');
        console.log('   2. Login to admin panel with: admin@gaadiwala.com / admin123');
        console.log('   3. Add images to vehicles from the admin panel');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
