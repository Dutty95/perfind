import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod = null;

const connectDB = async () => {
  try {
    let mongoUri;
    
    // Check if we have a valid MongoDB URI in environment
    if (process.env.MONGO_URI && 
        process.env.MONGO_URI !== 'mongodb+srv://demo:demo123@cluster0.mongodb.net/perfind?retryWrites=true&w=majority' &&
        !process.env.MONGO_URI.includes('demo:demo123')) {
      // Use production/configured MongoDB
      mongoUri = process.env.MONGO_URI;
      console.log('Connecting to configured MongoDB...');
    } else {
      // Use MongoDB Memory Server for development
      console.log('Starting MongoDB Memory Server for development...');
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'perfind_dev'
        }
      });
      mongoUri = mongod.getUri();
      console.log('MongoDB Memory Server started successfully');
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('Database connection error:', error.message);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
      console.log('MongoDB Memory Server stopped');
    }
  } catch (error) {
    console.error('Error disconnecting from database:', error.message);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT. Gracefully shutting down...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM. Gracefully shutting down...');
  await disconnectDB();
  process.exit(0);
});

export { connectDB, disconnectDB };
export default connectDB;