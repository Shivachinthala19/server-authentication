require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Base route for sanity check
app.get('/', (req, res) => {
  res.json({ message: 'Secure Auth API is running.' });
});

// Database connection
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      console.log('Connecting to configured MONGODB_URI...');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Successfully connected to MongoDB Atlas.');
      return;
    } catch (error) {
      console.warn(`⚠️  Failed to connect to MONGODB_URI: ${error.message}`);
    }
  }

  // Attempt local MongoDB connection if MONGODB_URI not specified or failed
  try {
    console.log('Attempting connection to local MongoDB at mongodb://127.0.0.1:27017/secure-auth-db...');
    await mongoose.connect('mongodb://127.0.0.1:27017/secure-auth-db', { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Successfully connected to local MongoDB.');
    return;
  } catch (error) {
    console.warn(`⚠️  Could not connect to local MongoDB. Trying MongoDB Memory Server fallback...`);
  }

  // Fallback: MongoDB Memory Server
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri();
    console.log('In-memory MongoDB Server created successfully.');
    await mongoose.connect(memoryUri);
    console.log('✅ Connected to In-memory MongoDB at:', memoryUri);
  } catch (fallbackError) {
    console.error('\n❌ CRITICAL: Could not initialize any MongoDB connection:', fallbackError.message);
    console.error('👉 Tip: Set MONGODB_URI in your .env to a MongoDB Atlas connection string.\n');
    process.exit(1);
  }
};

// Start Server — connect to DB FIRST, then listen
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`👉 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`👉 Tasks endpoints: http://localhost:${PORT}/api/tasks\n`);
  });
};

startServer();
