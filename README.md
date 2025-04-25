# Restaurant Booking System

A comprehensive backend API for restaurant table management and reservation system. This system allows restaurant staff to manage tables, reservations, and customers, while enabling customers to book tables online.

## 🍽️ Features

- **User Management**: Multi-level user system (Admin, Manager, Staff, Customer)
- **Table Management**: Configure tables with different capacities and sections
- **Reservation System**: 
  - Automated table assignment based on party size
  - Custom duration bookings
  - Status tracking (pending, confirmed, seated, completed, etc.)
- **Restaurant Settings**: 
  - Customizable opening hours
  - Special events management
  - Closed date handling
  - Booking rules configuration
- **Availability Checking**: Real-time checking of table availability
- **RESTful API**: Well-structured API for integration with front-end applications

## 🛠️ Technologies

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM (Object Data Modeling)
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **moment** - Date handling

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## 🚀 Getting Started

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/restaurant-booking-system.git
   cd restaurant-booking-system
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   ```

### Setting Up the Database

1. Seed the database with initial data
   ```bash
   npm run seed
   ```
   This will create:
   - An admin user (email: admin@leustache.com, password: password)
   - Restaurant configuration for "L'Eustache"
   - Sample tables

### Running the Application

1. Start the server in development mode
   ```bash
   npm run dev
   ```

2. Start the server in production mode
   ```bash
   npm start
   ```

3. Test the system
   ```bash
   npm run test
   ```

4. Debug mode (for development)
   ```bash
   npm run debug
   ```

## 🏗️ Project Structure

```
restaurant-booking-system/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # Express routes
│   ├── utils/          # Utility functions
│   └── server.js       # Entry point
├── .env                # Environment variables (create this)
├── .gitignore          # Git ignore file
├── package.json        # Dependencies and scripts
└── test-system.js      # Test script
```

## 📝 API Documentation

### Authentication Endpoints

| Method | Endpoint           | Description            | Access     |
|--------|-------------------|------------------------|------------|
| POST   | /api/auth/register | Register a new user    | Public     |
| POST   | /api/auth/login    | User login             | Public     |
| GET    | /api/auth/me       | Get current user       | Private    |
| GET    | /api/auth/logout   | Logout user            | Private    |

### Restaurant Endpoints

| Method | Endpoint                      | Description                 | Access        |
|--------|------------------------------|-----------------------------|---------------|
| GET    | /api/restaurant               | Get restaurant settings     | Public        |
| POST   | /api/restaurant               | Create restaurant settings  | Admin         |
| PUT    | /api/restaurant               | Update restaurant settings  | Admin/Manager |
| PUT    | /api/restaurant/opening-hours | Update opening hours        | Admin/Manager |
| POST   | /api/restaurant/special-events| Add special event           | Admin/Manager |
| POST   | /api/restaurant/closed-dates  | Add closed date             | Admin/Manager |
| PUT    | /api/restaurant/booking-rules | Update booking rules        | Admin/Manager |

### Booking Endpoints

| Method | Endpoint                    | Description               | Access        |
|--------|-----------------------------|---------------------------|---------------|
| POST   | /api/bookings/check-availability | Check table availability | Public        |
| POST   | /api/bookings/lookup        | Lookup booking by ref     | Public        |
| POST   | /api/bookings               | Create booking            | Public        |
| GET    | /api/bookings               | Get all bookings          | Private       |
| GET    | /api/bookings/:id           | Get booking by ID         | Private       |
| PUT    | /api/bookings/:id           | Update booking            | Private       |
| DELETE | /api/bookings/:id           | Delete booking            | Private       |
| PUT    | /api/bookings/:id/status    | Update booking status     | Staff+        |

### Table Endpoints

| Method | Endpoint                    | Description               | Access        |
|--------|-----------------------------|---------------------------|---------------|
| GET    | /api/tables                 | Get all tables            | Staff+        |
| POST   | /api/tables                 | Create table              | Staff+        |
| GET    | /api/tables/:id             | Get table by ID           | Staff+        |
| PUT    | /api/tables/:id             | Update table              | Staff+        |
| DELETE | /api/tables/:id             | Delete table              | Admin         |
| GET    | /api/tables/availability/:date | Get table availability | Staff+        |

### User Endpoints

| Method | Endpoint                    | Description               | Access        |
|--------|-----------------------------|---------------------------|---------------|
| GET    | /api/users                  | Get all users             | Admin         |
| POST   | /api/users                  | Create user               | Admin         |
| GET    | /api/users/:id              | Get user by ID            | Admin         |
| PUT    | /api/users/:id              | Update user               | Admin         |
| DELETE | /api/users/:id              | Delete user               | Admin         |
| GET    | /api/users/:id/bookings     | Get user bookings         | Admin/Self    |

## 🔒 Authentication and Authorization

The system uses JWT (JSON Web Tokens) for authentication. Each endpoint has specific access levels:

- **Public**: Accessible without authentication
- **Private**: Requires authentication
- **Staff+**: Requires staff, manager, or admin role
- **Admin**: Requires admin role
- **Admin/Manager**: Requires admin or manager role
- **Admin/Self**: Accessible by admin or the user themselves

## 📱 Frontend Integration

The system is built as a RESTful API that can be integrated with any frontend. To integrate:

1. Connect to the API endpoints using HTTP requests
2. Store JWT token upon login and include in subsequent requests
3. Handle responses according to the API documentation

## 🔍 Booking Algorithm

The system uses a sophisticated algorithm to assign tables:

1. First, it looks for a single table that exactly matches the party size
2. If none available, it finds the smallest table that can accommodate the party
3. If no single table is large enough, it combines tables to fit the party
4. It considers restaurant capacity limits and booking rules

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.
