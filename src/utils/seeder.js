// src/utils/seeder.js - Modified for L'Eustache only
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Import models
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Table = require('../models/Table');
const Booking = require('../models/Booking');
const Availability = require('../models/Availability');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Reset database (drop all collections)
const resetDatabase = async () => {
  try {
    console.log('Resetting database...');

    // Drop all collections
    await Booking.collection.drop().catch(err => {
      if (err.code !== 26) console.error('Error dropping Booking collection:', err);
      // Error code 26 means collection doesn't exist, which is fine
    });

    await Availability.collection.drop().catch(err => {
      if (err.code !== 26) console.error('Error dropping Availability collection:', err);
    });

    await Table.collection.drop().catch(err => {
      if (err.code !== 26) console.error('Error dropping Table collection:', err);
    });

    await Restaurant.collection.drop().catch(err => {
      if (err.code !== 26) console.error('Error dropping Restaurant collection:', err);
    });

    await User.collection.drop().catch(err => {
      if (err.code !== 26) console.error('Error dropping User collection:', err);
    });

    console.log('Database reset complete');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@leustache.com',
      phone: '123-456-7890',
      password: 'password',  // This will be hashed by the pre-save hook
      role: 'admin'
    });

    console.log('Admin user created:', admin.email);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  }
};

// Create L'Eustache restaurant settings
const createRestaurantSettings = async () => {
  try {
    // Create restaurant settings
    const restaurant = await Restaurant.create({
      name: "L'Eustache",
      description: "We are a casual French bistro with an organic, local and seasonal cuisine accompanied by living wines! Our reservations allows you to secure your table for a duration of 2 hours. Tables of 7 or more people please email us at restaurantleustache@gmail.com",
      address: {
        street: 'Weisestraße 49',
        city: 'Berlin',
        state: '',
        zipCode: '12049',
        country: 'Germany'
      },
      contact: {
        phone: '0163 5172664',
        email: 'restaurantleustache@gmail.com',
        website: 'www.leustache.com'
      },
      openingHours: [
        { day: 0, open: "18:00", close: "23:45", isClosed: true },  // Sunday - closed
        { day: 1, open: "18:00", close: "23:45", isClosed: true },  // Monday - closed
        { day: 2, open: "18:00", close: "23:45", isClosed: true },  // Tuesday - closed
        { day: 3, open: "18:00", close: "23:45", isClosed: false }, // Wednesday
        { day: 4, open: "18:00", close: "23:45", isClosed: false }, // Thursday
        { day: 5, open: "18:00", close: "23:45", isClosed: false }, // Friday
        { day: 6, open: "18:00", close: "23:45", isClosed: false }  // Saturday
      ],
      maxCapacity: 80,
      bookingRules: {
        timeSlotDuration: 15,          // Allow 15-minute intervals
        minAdvanceBooking: 60,         // 1 hour in advance minimum
        maxAdvanceBooking: 30,         // Up to 30 days in advance
        maxDuration: 120,              // 2 hours per booking
        bufferBetweenBookings: 15,     // 15 minutes between bookings
        maxPartySize: 6,               // Tables of 7+ should email
        maxCapacityThreshold: 90,
        allowedPartySizes: {
          min: 1,
          max: 6
        }
      },
      closedDates: [
        // Add any specific closed dates if needed
      ],
      specialEvents: [
        // Add any special events if needed
      ]
    });

    console.log('Restaurant settings created:', restaurant.name);
  } catch (error) {
    console.error('Error creating restaurant settings:', error.message);
  }
};

// Create tables for L'Eustache
const createTables = async () => {
  try {
    // Create indoor tables
    for (let i = 1; i <= 15; i++) {
      await Table.create({
        tableNumber: `A${i}`,
        capacity: 2,
        section: 'indoor',
        shape: 'round',
        isActive: true,
        isReservable: true
      });
    }

    // Create outdoor tables
    for (let i = 1; i <= 5; i++) {
      await Table.create({
        tableNumber: `O${i}`,
        capacity: 2,
        section: 'outdoor',
        shape: 'round',
        isActive: true,
        isReservable: true
      });
    }

    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error.message);
  }
};

// Run seed functions
const seedData = async () => {
  await connectDB();

  // Reset database first
  await resetDatabase();

  // Create new data
  await createAdminUser();
  await createRestaurantSettings();
  await createTables();

  console.log('Seed completed');
  process.exit();
};

// Execute the seeder
seedData();
