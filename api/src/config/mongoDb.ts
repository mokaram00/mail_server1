import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection URIs
const mongoUri = process.env.MONGODB_URI as string;
const adminMongoUri = process.env.ADMIN_MONGODB_URI as string || mongoUri;

// Create separate connections for user and admin databases
const userConnection = mongoose.createConnection(mongoUri);
const adminConnection = mongoose.createConnection(adminMongoUri);

console.log('User DB URI:', mongoUri);
console.log('Admin DB URI:', adminMongoUri);

// Connect to MongoDB databases
const connectDB = async (): Promise<void> => {
  try {
    await userConnection.asPromise();
    console.log('User MongoDB connected successfully');
    
    await adminConnection.asPromise();
    console.log('Admin MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export { connectDB, userConnection, adminConnection };