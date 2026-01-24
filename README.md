# Gaadiwala Backend API

Backend API for the Gaadiwala used vehicle marketplace platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env` file

3. Make sure MongoDB is running locally or update MONGODB_URI in .env

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST /api/auth/login - Admin login
- POST /api/auth/register - Register new admin (requires superadmin)
- GET /api/auth/verify - Verify token

### Vehicles
- GET /api/vehicles - Get all vehicles (with filters)
- GET /api/vehicles/:id - Get single vehicle
- POST /api/vehicles - Create vehicle (admin only)
- PUT /api/vehicles/:id - Update vehicle (admin only)
- DELETE /api/vehicles/:id - Delete vehicle (admin only)

### Bookings
- POST /api/bookings - Create booking/inquiry
- GET /api/bookings - Get all bookings (admin only)
- GET /api/bookings/:id - Get single booking (admin only)
- PUT /api/bookings/:id - Update booking (admin only)
- DELETE /api/bookings/:id - Delete booking (admin only)

## Default Admin Account

To create the first admin account, you'll need to manually create it in MongoDB or use the register endpoint after temporarily removing the auth middleware.
