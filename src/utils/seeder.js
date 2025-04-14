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

    console.log('Admin user created:', admin.email);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  }
};

// Create restaurant settings
const createRestaurantSettings = async () => {
  try {
    // Check if restaurant settings already exist
    const restaurantExists = await Restaurant.findOne();

    if (restaurantExists) {
      console.log('Restaurant settings already exist');
      return;
    }

    // Create restaurant settings
    const restaurant = await Restaurant.create({
      name: 'Demo Restaurant',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'State',
        zipCode: '12345',
        country: 'Country'
      },
      contact: {
        phone: '123-456-7890',
        email: 'info@restaurant.com',
        website: 'www.restaurant.com'
      },
      openingHours: [
        { day: 0, open: '12:00', close: '22:00', isClosed: false }, // Sunday
        { day: 1, open: '11:00', close: '22:00', isClosed: false }, // Monday
        { day: 2, open: '11:00', close: '22:00', isClosed: false }, // Tuesday
        { day: 3, open: '11:00', close: '22:00', isClosed: false }, // Wednesday
        { day: 4, open: '11:00', close: '23:00', isClosed: false }, // Thursday
        { day: 5, open: '11:00', close: '23:00', isClosed: false }, // Friday
        { day: 6, open: '12:00', close: '23:00', isClosed: false }  // Saturday
      ],
      maxCapacity: 100,
      bookingRules: {
        timeSlotDuration: 30,
        minAdvanceBooking: 60,
        maxAdvanceBooking: 30,
        maxDuration: 120,
        bufferBetweenBookings: 15,
        maxPartySize: 10,
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
          date: new Date(new Date().getFullYear(), 0, 1), // New Year's Day
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
      { tableNumber: 'T1', capacity: 2, section: 'window' },
      { tableNumber: 'T2', capacity: 2, section: 'window' },
      { tableNumber: 'T3', capacity: 4, section: 'indoor' },
      { tableNumber: 'T4', capacity: 4, section: 'indoor' },
      { tableNumber: 'T5', capacity: 4, section: 'indoor' },
      { tableNumber: 'T6', capacity: 6, section: 'indoor' },
      { tableNumber: 'T7', capacity: 6, section: 'indoor' },
      { tableNumber: 'T8', capacity: 8, section: 'indoor' },
      { tableNumber: 'B1', capacity: 2, section: 'bar' },
      { tableNumber: 'B2', capacity: 2, section: 'bar' },
      { tableNumber: 'B3', capacity: 2, section: 'bar' },
      { tableNumber: 'B4', capacity: 2, section: 'bar' },
      { tableNumber: 'O1', capacity: 4, section: 'outdoor' },
      { tableNumber: 'O2', capacity: 4, section: 'outdoor' },
      { tableNumber: 'O3', capacity: 6, section: 'outdoor' },
      { tableNumber: 'P1', capacity: 10, section: 'private' }
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
