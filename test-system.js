const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Restaurant = require('./src/models/Restaurant');
const User = require('./src/models/User');
const Table = require('./src/models/Table');
const Booking = require('./src/models/Booking');
const Availability = require('./src/models/Availability');

// Load environment variables
dotenv.config();

// Function to test database connection and models
const testSystem = async () => {
  try {
    console.log('Starting system test...');

    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected!');

    // Test models by checking if they exist
    console.log('\nChecking models...');
    console.log('Restaurant model:', !!Restaurant);
    console.log('User model:', !!User);
    console.log('Table model:', !!Table);
    console.log('Booking model:', !!Booking);
    console.log('Availability model:', !!Availability);

    // Test database contents
    console.log('\nChecking database contents...');

    // Check users
    const users = await User.find();
    console.log(`Users: ${users.length} found`);
    if (users.length > 0) {
      console.log('Sample user:', {
        name: users[0].name,
        email: users[0].email,
        role: users[0].role
      });
    }

    // Check restaurant
    const restaurant = await Restaurant.findOne();
    console.log(`Restaurant settings: ${restaurant ? 'Found' : 'Not found'}`);
    if (restaurant) {
      console.log('Restaurant name:', restaurant.name);
      console.log('Max capacity:', restaurant.maxCapacity);
      console.log('Opening hours count:', restaurant.openingHours.length);
    }

    // Check tables
    const tables = await Table.find();
    console.log(`Tables: ${tables.length} found`);
    if (tables.length > 0) {
      console.log('Sample tables:');
      tables.slice(0, 3).forEach(table => {
        console.log(`- ${table.tableNumber}: Capacity ${table.capacity}, Section: ${table.section}`);
      });
    }

    // Check bookings
    const bookings = await Booking.find();
    console.log(`Bookings: ${bookings.length} found`);

    console.log('\nSystem test completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('Error during system test:', error);
    process.exit(1);
  }
};

// Run the test
testSystem();
