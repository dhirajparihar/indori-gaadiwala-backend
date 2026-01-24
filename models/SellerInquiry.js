const mongoose = require('mongoose');

const sellerInquirySchema = new mongoose.Schema({
    // User submitted fields
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    regNo: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    kmDriven: {
        type: Number,
        required: true
    },
    demand: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['car', 'bike', 'commercial'],
        default: 'car'
    },
    photos: {
        type: [String],
        default: []
    },
    rcCard: {
        type: String,
        default: ''
    },

    // Vehicle details from Cars24 API
    // Basic Info
    make: { type: String, default: '' },
    model: { type: String, default: '' },
    variant: { type: String, default: '' },
    variantDisplayName: { type: String, default: '' },
    year: { type: String, default: '' },
    regnYear: { type: String, default: '' },
    color: { type: String, default: '' },
    bodyType: { type: String, default: '' },

    // Fuel & Transmission
    fuelType: { type: String, default: '' },
    rawFuelType: { type: String, default: '' },
    transmissionType: { type: String, default: '' },

    // Registration Details
    registeredPlace: { type: String, default: '' },
    registeredAt: { type: String, default: '' },
    vehicleCategory: { type: String, default: '' },
    vehicleClassDesc: { type: String, default: '' },
    rcModel: { type: String, default: '' },
    rcStatus: { type: String, default: '' },
    rcOwnerCount: { type: String, default: '' },
    rcOwnerNameMasked: { type: String, default: '' },

    // Insurance & Fitness
    insuranceCompany: { type: String, default: '' },
    insuranceUpTo: { type: String, default: '' },
    fitnessUpTo: { type: String, default: '' },
    pucUpTo: { type: String, default: '' },
    taxUpTo: { type: String, default: '' },

    // Finance
    hypothecation: { type: Boolean, default: false },
    financier: { type: String, default: '' },
    rtoNocIssued: { type: String, default: '' },

    // Manufacturing
    manufacturingMonthYr: { type: String, default: '' },
    unladenWt: { type: String, default: '' },
    seatCap: { type: String, default: '' },

    // Status tracking
    status: {
        type: String,
        enum: ['new', 'contacted', 'completed', 'rejected'],
        default: 'new'
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SellerInquiry', sellerInquirySchema);
