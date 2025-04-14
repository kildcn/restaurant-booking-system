const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to database with error handling
const startServer = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected successfully');

    // Import routes
    const authRoutes = require('./routes/auth.routes');
    const restaurantRoutes = require('./routes/restaurant.routes');
    const bookingRoutes = require('./routes/booking.routes');
    const tableRoutes = require('./routes/table.routes');
    const userRoutes = require('./routes/user.routes');

    // Mount routes
    app.use('/api/auth', authRoutes);
    app.use('/api/restaurant', restaurantRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/tables', tableRoutes);
    app.use('/api/users', userRoutes);

    // Basic route
    app.get('/', (req, res) => {
      res.send('Restaurant Booking API is running...');
    });

    // Error handling middleware
    app.use(errorHandler);

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server failed to start:', error.message);
    process.exit(1);
  }
};

startServer();
