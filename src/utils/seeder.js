// src/utils/seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Import models
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Table = require('../models/Table');

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

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@restaurant.com' });

    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@restaurant.com',
      phone: '123-456-7890',
      password: 'password123',  // This will be hashed by the pre-save hook
      role: 'admin'
    });

    // Create a customer user for demo
    const customer = await User.create({
      name: 'Demo Customer',
      email: 'customer@example.com',
      phone: '123-456-7890',
      password: 'password123',  // This will be hashed by the pre-save hook
      role: 'customer'
    });

    console.log('Admin user created:', admin.email);
    console.log('Customer user created:', customer.email);
  } catch (error) {
    console.error('Error creating users:', error.message);
  }
};

// Create restaurant settings
const createRestaurantSettings = async () => {
  try {
    // Check if restaurant settings already exist
    const restaurantExists = await Restaurant.findOne();

    if (restaurantExists) {
      console.log('Restaurant settings already exist');

      // Update existing restaurant with correct hours
      restaurantExists.name = "L'Eustache";
      restaurantExists.description = "We are a casual French bistro with an organic, local and seasonal cuisine accompanied by living wines! Our reservations allows you to secure your table for a duration of 2 hours. Tables of 7 or more people please email us at restaurantleustache@gmail.com";
      restaurantExists.contact.email = "restaurantleustache@gmail.com";

      // Update opening hours - Wednesday to Saturday, 6PM to 11:45PM
      restaurantExists.openingHours = [
        { day: 0, open: "18:00", close: "23:45", isClosed: true },  // Sunday - closed
        { day: 1, open: "18:00", close: "23:45", isClosed: true },  // Monday - closed
        { day: 2, open: "18:00", close: "23:45", isClosed: true },  // Tuesday - closed
        { day: 3, open: "18:00", close: "23:45", isClosed: false }, // Wednesday
        { day: 4, open: "18:00", close: "23:45", isClosed: false }, // Thursday
        { day: 5, open: "18:00", close: "23:45", isClosed: false }, // Friday
        { day: 6, open: "18:00", close: "23:45", isClosed: false }  // Saturday
      ];

      await restaurantExists.save();
      console.log('Restaurant settings updated');
      return;
    }

    // Create restaurant settings
    const restaurant = await Restaurant.create({
      name: "L'Eustache",
      description: "We are a casual French bistro with an organic, local and seasonal cuisine accompanied by living wines! Our reservations allows you to secure your table for a duration of 2 hours. Tables of 7 or more people please email us at restaurantleustache@gmail.com",
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'State',
        zipCode: '12345',
        country: 'Country'
      },
      contact: {
        phone: '123-456-7890',
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
        maxPartySize: 10,              // Tables of 7+ should email
        maxCapacityThreshold: 90,
        allowedPartySizes: {
          min: 1,
          max: 10
        }
      },
      closedDates: [
        {
          date: new Date(new Date().getFullYear(), 11, 25), // Christmas
          reason: 'Christmas Day'
        },
        {
          date: new Date(new Date().getFullYear(), 0, 1),  // New Year's Day
          reason: 'New Year\'s Day'
        }
      ]
    });

    console.log('Restaurant settings created:', restaurant.name);
  } catch (error) {
    console.error('Error creating restaurant settings:', error.message);
  }
};

// Create sample tables
const createSampleTables = async () => {
  try {
    // Check if tables already exist
    const tablesExist = await Table.countDocuments();

    if (tablesExist > 0) {
      console.log('Tables already exist');
      return;
    }

    // Sample tables data
    const tablesData = [
      { tableNumber: 'A1', capacity: 2, section: 'window', shape: 'round' },
      { tableNumber: 'A2', capacity: 2, section: 'window', shape: 'round' },
      { tableNumber: 'A3', capacity: 4, section: 'indoor', shape: 'rectangle' },
      { tableNumber: 'A4', capacity: 4, section: 'indoor', shape: 'rectangle' },
      { tableNumber: 'A5', capacity: 4, section: 'indoor', shape: 'rectangle' },
      { tableNumber: 'A6', capacity: 6, section: 'indoor', shape: 'rectangle' },
      { tableNumber: 'A7', capacity: 6, section: 'indoor', shape: 'rectangle' },
      { tableNumber: 'A8', capacity: 8, section: 'indoor', shape: 'rectangle' },
      { tableNumber: 'B1', capacity: 2, section: 'bar', shape: 'round' },
      { tableNumber: 'B2', capacity: 2, section: 'bar', shape: 'round' },
      { tableNumber: 'B3', capacity: 2, section: 'bar', shape: 'round' },
      { tableNumber: 'B4', capacity: 2, section: 'bar', shape: 'round' },
      { tableNumber: 'C1', capacity: 4, section: 'outdoor', shape: 'rectangle' },
      { tableNumber: 'C2', capacity: 4, section: 'outdoor', shape: 'rectangle' },
      { tableNumber: 'C3', capacity: 6, section: 'outdoor', shape: 'rectangle' },
      { tableNumber: 'P1', capacity: 10, section: 'private', shape: 'rectangle' }
    ];

    // Insert tables
    await Table.insertMany(tablesData);

    console.log(`${tablesData.length} tables created`);
  } catch (error) {
    console.error('Error creating sample tables:', error.message);
  }
};

// Run seed functions
const seedData = async () => {
  await connectDB();

  await createAdminUser();
  await createRestaurantSettings();
  await createSampleTables();

  console.log('Seed completed');
  process.exit();
};

// Execute the seeder
seedData();
