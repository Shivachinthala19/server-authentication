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
  const localUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure-auth-db';
  
  try {
    console.log('Attempting connection to MongoDB at:', localUri);
    // Set bufferTimeout to fast-fail if local mongo isn't active
    await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 2000, 
    });
    console.log('Successfully connected to MongoDB database.');
  } catch (error) {
    console.warn('\n⚠️  Could not connect to local MongoDB. Launching MongoDB Memory Server (in-memory MongoDB) fallback...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      
      console.log('In-memory MongoDB Server created successfully.');
      await mongoose.connect(memoryUri);
      console.log('Connected to In-memory MongoDB at:', memoryUri);
    } catch (fallbackError) {
      console.error('CRITICAL ERROR: Failed to connect to local MongoDB and failed to launch MongoDB Memory Server fallback.');
      console.error(fallbackError);
      process.exit(1);
    }
  }
};

// Start Server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`👉 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`👉 Tasks endpoints: http://localhost:${PORT}/api/tasks\n`);
  });
});
