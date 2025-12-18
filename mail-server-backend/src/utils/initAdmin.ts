import bcrypt from 'bcryptjs';
import { connectDB, adminConnection } from '../config/mongoDb';
import Admin from '../models/Admin';

const initAdmin = async () => {
  try {
    // Connect to databases
    await connectDB();
    
    // Check if admin user already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@bltnm.store' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);
    
    // Create admin user
    const admin = new Admin({
      username: 'admin',
      email: 'admin@bltnm.store',
      password: hashedPassword,
      role: 'superadmin',
      isActive: true,
      permissions: ['all']
    });
    
    await admin.save();
    
    console.log('Admin user created successfully');
    console.log('Email: admin@bltnm.store');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing admin:', error);
    process.exit(1);
  }
};

initAdmin();