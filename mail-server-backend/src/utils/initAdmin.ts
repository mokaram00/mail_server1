import bcrypt from 'bcryptjs';
import User from '../models/User';
import sequelize from '../config/db';

const SALT_ROUNDS = 10;

const initAdmin = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync models
    await sequelize.sync({ alter: true });
    console.log('Database synced.');

    // Check if admin user already exists
    const adminExists = await User.findOne({
      where: {
        role: 'admin',
      },
    });

    if (adminExists) {
      console.log('Admin user already exists.');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
    
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@mailserver.local',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });

    console.log('Admin user created successfully:');
    console.log(`Username: ${adminUser.username}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: admin123 (change this after first login)`);
  } catch (error) {
    console.error('Error initializing admin user:', error);
  } finally {
    // Close database connection
    await sequelize.close();
  }
};

// Run the initialization
initAdmin();