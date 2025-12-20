import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';
import Emails from '../models/Emails';
import Mailbox from '../models/Mailbox';
import Domain from '../models/Domain';
import Category from '../models/Category';
import Order from '../models/Order';
import Product from '../models/Product';
import { User } from '../models/User';
import { sendPurchaseEmails } from '../utils/purchaseEmails.js';
import { IProduct } from '../models/Product';

// Extend the Request type to include admin property
interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    role: string;
  };
  user?: any; // Keep for backward compatibility
}

export const getAdmins = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Get all admins
    const admins = await Admin.find({}).select('-password'); // Exclude passwords

    return res.status(200).json({
      admins,
    });
  } catch (error) {
    console.error('Get admins error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const getUsers = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Get all emails except the current admin and except permanent classification/domain emails
    const emails = await Emails.find({
      _id: { $ne: req.admin?.id }, // Not equal to current admin
      username: { 
        $not: { 
          $regex: /^(classification_|domain_)/ 
        } 
      } // Exclude permanent classification and domain emails
    }).select('-password'); // Exclude passwords

    return res.status(200).json({
      emails,
    });
  } catch (error) {
    console.error('Get emails error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    // Find user by ID
    const user = await Emails.findById(id).select('-password'); // Exclude password

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAdminRole = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role parameter' });
    }

    // Find admin by ID
    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Update admin role
    admin.role = role;
    await admin.save();

    return res.status(200).json({
      message: 'Admin role updated successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Update admin role error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deactivateAdmin = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    // Find admin by ID
    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent admin from deactivating themselves
    if (admin._id.toString() === req.admin?.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    // Deactivate admin
    admin.isActive = false;
    await admin.save();

    return res.status(200).json({
      message: 'Admin deactivated successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    console.error('Deactivate admin error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUserRole = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    return res.status(400).json({ message: 'User roles are no longer supported' });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update user classification
export const updateUserClassification = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { classification } = req.body;

    // Find user by ID
    const user = await Emails.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user classification
    user.accountClassification = classification || null;
    await user.save();

    return res.status(200).json({
      message: 'User classification updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        accountClassification: user.accountClassification,
        isConnected: user.isConnected,
      },
    });
  } catch (error) {
    console.error('Update user classification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deactivateUser = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    // Find user by ID
    const user = await Emails.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent user from deactivating themselves
    if (user._id.toString() === req.admin?.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    // Deactivate user
    user.isActive = false;
    await user.save();

    return res.status(200).json({
      message: 'User deactivated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
        isConnected: user.isConnected,
      },
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update user connection status
export const updateUserConnectionStatus = async (req: AdminAuthRequest,  res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isConnected } = req.body;

    // Find user by ID
    const user = await Emails.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user connection status
    user.isConnected = isConnected;
    await user.save();

    return res.status(200).json({
      message: 'User connection status updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isConnected: user.isConnected,
      },
    });
  } catch (error) {
    console.error('Update user connection status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSystemStats = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Get system statistics excluding permanent classification/domain emails
    const totalUsers = await Emails.countDocuments({
      username: { 
        $not: { 
          $regex: /^(classification_|domain_)/ 
        } 
      }
    });
    const totalEmails = await Mailbox.countDocuments();
    const activeUsers = await Emails.countDocuments({
      isActive: true,
      username: { 
        $not: { 
          $regex: /^(classification_|domain_)/ 
        } 
      }
    });

    // Get admin statistics
    const totalAdmins = await Admin.countDocuments();
    const activeAdmins = await Admin.countDocuments({
      isActive: true,
    });

    return res.status(200).json({
      stats: {
        totalUsers,
        totalEmails,
        activeUsers,
        totalAdmins,
        activeAdmins
      },
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new user
export const createUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { username, password, domain, isDefaultDomain, accountClassification } = req.body;
    
    console.log('Create user request body:', req.body);
    
    // Validate required fields
    if (!username || !password) {
      console.log('Validation failed: username and password are required');
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Handle empty strings for domain and accountClassification
    const cleanDomain = domain === '' ? null : domain;
    const cleanAccountClassification = accountClassification === '' ? null : accountClassification;
    
    // Automatically generate email if domain is provided
    let email = req.body.email;
    if (cleanDomain && cleanDomain.trim() !== '' && !email) {
      email = `${username}@${cleanDomain}`;
      console.log(`Generated email with domain: ${email}`);
    } else if (cleanDomain && cleanDomain.trim() !== '' && email && !email.endsWith(`@${cleanDomain}`)) {
      // If both email and domain are provided but email doesn't match domain, use the domain
      email = `${username}@${cleanDomain}`;
      console.log(`Overrode email with domain-based email: ${email}`);
    }

    // Validate that email is provided (either directly or generated)
    if (!email) {
      console.log('Email validation failed: email is required');
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await Emails.findOne({
      email: email,
    });

    if (existingUser) {
      console.log(`User validation failed: user with email ${email} already exists`);
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if the classification exists in the Category collection
    if (cleanAccountClassification && cleanAccountClassification.trim() !== '') {
      const existingClassification = await Category.findOne({
        name: cleanAccountClassification
      });

      if (!existingClassification) {
        console.log(`Classification ${cleanAccountClassification} does not exist`);
        return res.status(400).json({ message: `Classification '${cleanAccountClassification}' does not exist` });
      }
    }

    // Check if the domain exists in the Domain collection
    if (cleanDomain && cleanDomain.trim() !== '') {
      const existingDomain = await Domain.findOne({
        domain: cleanDomain
      });

      if (!existingDomain) {
        console.log(`Domain ${cleanDomain} does not exist`);
        return res.status(400).json({ message: `Domain '${cleanDomain}' does not exist` });
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');

    // Create user
    const user = new Emails({
      username,
      email,
      password: hashedPassword,
      isActive: true, // Default active status
      domain: cleanDomain || null,
      isDefaultDomain: isDefaultDomain || false,
      accountClassification: cleanAccountClassification || null,
    });
    
    await user.save();
    console.log(`User created successfully with ID: ${user._id}`);

    // Return user data without password
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
      isConnected: user.isConnected,
      domain: user.domain,
      accountClassification: user.accountClassification,
    };

    return res.status(201).json({
      message: 'User created successfully',
      user: userData,
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Bulk create emails
export const bulkCreateUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { emails } = req.body;
    console.log(`Bulk creating ${emails.length} emails`);

    // Validate input
    if (!Array.isArray(emails) || emails.length === 0) {
      console.log('Bulk create validation failed: emails array is required and cannot be empty');
      return res.status(400).json({ message: 'Users array is required and cannot be empty' });
    }

    // Validate each user and generate emails if needed
    for (const user of emails) {
      console.log('Validating user:', user);
      if (!user.username || !user.password) {
        console.log('User validation failed: each user must have username and password');
        return res.status(400).json({ 
          message: 'Each user must have username and password',
          user: user
        });
      }

      // Handle empty strings for domain and accountClassification
      if (user.domain === '') user.domain = null;
      if (user.accountClassification === '') user.accountClassification = null;

      // Automatically generate email if domain is provided and email is not
      if (user.domain && user.domain.trim() !== '' && !user.email) {
        user.email = `${user.username}@${user.domain}`;
        console.log(`Generated email for user ${user.username}: ${user.email}`);
      } else if (user.domain && user.domain.trim() !== '' && user.email && !user.email.endsWith(`@${user.domain}`)) {
        // If both email and domain are provided but email doesn't match domain, use the domain
        user.email = `${user.username}@${user.domain}`;
        console.log(`Overrode email for user ${user.username}: ${user.email}`);
      }

      // Validate that email is provided (either directly or generated)
      if (!user.email) {
        console.log(`Email validation failed for user ${user.username}: each user must have an email`);
        return res.status(400).json({ 
          message: 'Each user must have an email',
          user: user
        });
      }
    }

    // Check for existing emails
    const emailAddresses = emails.map(user => user.email);
    console.log('Checking for existing emails with emails:', emailAddresses);
    const existingUsers = await Emails.find({
      email: {
        $in: emailAddresses
      }
    });

    if (existingUsers.length > 0) {
      const existingEmails = existingUsers.map(user => user.email);
      console.log('Existing emails found with emails:', existingEmails);
      return res.status(400).json({ 
        message: 'Some emails with these emails already exist',
        existingEmails: existingEmails
      });
    }

    // Check if all classifications and domains exist
    console.log('Checking classifications and domains');
    for (const user of emails) {
      if (user.accountClassification && user.accountClassification.trim() !== '') {
        const existingClassification = await Category.findOne({
          name: user.accountClassification
        });

        if (!existingClassification) {
          console.log(`Classification ${user.accountClassification} does not exist`);
          return res.status(400).json({ 
            message: `Classification '${user.accountClassification}' does not exist`,
            user: user
          });
        }
      }
      
      if (user.domain && user.domain.trim() !== '') {
        const existingDomain = await Domain.findOne({
          domain: user.domain
        });

        if (!existingDomain) {
          console.log(`Domain ${user.domain} does not exist`);
          return res.status(400).json({ 
            message: `Domain '${user.domain}' does not exist`,
            user: user
          });
        }
      }
    }

    // Hash passwords and prepare user data
    const usersToCreate = [];
    for (const user of emails) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      usersToCreate.push({
        username: user.username,
        email: user.email,
        password: hashedPassword,
        isActive: true, // Default active status
        isConnected: false, // Default connection status
        domain: user.domain || null,
        accountClassification: user.accountClassification || null,
      });
    }

    // Create all emails
    const createdUsers = await Emails.insertMany(usersToCreate);
    console.log(`Successfully created ${createdUsers.length} emails`);

    // Return created emails without passwords
    const userData = createdUsers.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
      isConnected: user.isConnected,
      domain: user.domain,
      accountClassification: user.accountClassification,
    }));

    return res.status(201).json({
      message: `Successfully created ${createdUsers.length} emails`,
      emails: userData,
    });
  } catch (error) {
    console.error('Bulk create emails error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new admin
export const createAdmin = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    const { username, email, password, role } = req.body;
    
    console.log('Create admin request body:', req.body);
    
    // Validate required fields
    if (!username || !email || !password) {
      console.log('Validation failed: username, email, and password are required');
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // Validate email format
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email)) {
      console.log('Email validation failed: invalid email format');
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate role
    if (role && !['admin', 'superadmin'].includes(role)) {
      console.log(`Role validation failed: invalid role ${role}`);
      return res.status(400).json({ message: 'Invalid role parameter' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      email: email,
    });

    if (existingAdmin) {
      console.log(`Admin validation failed: admin with email ${email} already exists`);
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');

    // Create admin
    const admin = new Admin({
      username,
      email,
      password: hashedPassword,
      role: role || 'admin', // Default to 'admin' if not specified
      isActive: true, // Default active status
      permissions: [], // Default empty permissions
    });
    
    await admin.save();
    console.log(`Admin created successfully with ID: ${admin._id}`);

    // Return admin data without password
    const adminData = {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
    };

    return res.status(201).json({
      message: 'Admin created successfully',
      admin: adminData,
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getServerInfo = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Check if user is superadmin
    if (req.admin?.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Superadmin rights required.' });
    }

    // Get system information using systeminformation library
    const si = require('systeminformation');

    // Get all system data concurrently for better performance
    const [cpuData, cpuLoad, memData, fsData, networkData, timeData, processesData] = await Promise.all([
      si.cpu(),
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.time(),
      si.processes()
    ]);

    // CPU information
    const cpuUsage = cpuLoad.currentLoad;
    
    // Memory information
    const totalMem = memData.total;
    const usedMem = memData.active;
    const freeMem = memData.available;
    const memPercentage = totalMem > 0 ? (usedMem / totalMem) * 100 : 0;
    
    // Disk information
    const disk = fsData[0] || { size: 0, used: 0, available: 0 };
    const totalDisk = disk.size;
    const usedDisk = disk.used;
    const freeDisk = disk.available;
    const diskPercentage = totalDisk > 0 ? (usedDisk / totalDisk) * 100 : 0;
    
    // Network information
    const networkInterface = networkData[0] || { rx_bytes: 0, tx_bytes: 0 };
    const networkInfo = {
      rx: networkInterface.rx_bytes || 0,
      tx: networkInterface.tx_bytes || 0
    };
    
    // Uptime
    const uptime = timeData.uptime;
    
    // Load average - using current load as approximation since systeminformation
    // doesn't expose traditional load averages on all platforms
    const loadAvg = cpuLoad.avgLoad || 0;
    
    // Process count
    const processes = processesData.all || 0;

    return res.status(200).json({
      serverInfo: {
        cpu: {
          usage: cpuUsage,
          cores: cpuData.cores,
          model: `${cpuData.manufacturer} ${cpuData.brand}`
        },
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          percentage: memPercentage
        },
        disk: {
          total: totalDisk,
          used: usedDisk,
          free: freeDisk,
          percentage: diskPercentage
        },
        network: networkInfo,
        uptime: uptime.toString(),
        load: {
          '1min': loadAvg,
          '5min': loadAvg,
          '15min': loadAvg
        },
        processes: processes
      }
    });
  } catch (error) {
    console.error('Get server info error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


// Get all domains
export const getDomains = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('Fetching all domains');
    // Get all domains from the Domain collection
    const domains = await Domain.find({}, { domain: 1, isDefault: 1 });
    
    console.log(`Found ${domains.length} domains`);
    
    const domainDetails = domains.map(domain => ({
      domain: domain.domain,
      isDefault: domain.isDefault
    }));
    
    console.log('Domain list:', domainDetails);

    return res.status(200).json({
      domains: domainDetails
    });
  } catch (error) {
    console.error('Get domains error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Add a new domain
export const addDomain = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { domain } = req.body;
    console.log(`Received request to add domain: ${domain}`);

    // Validate input
    if (!domain) {
      console.log('Domain validation failed: domain is required');
      return res.status(400).json({ message: 'Domain is required' });
    }

    // Check if domain already exists
    const existingDomain = await Domain.findOne({
      domain: domain
    });

    if (existingDomain) {
      console.log(`Domain ${domain} already exists`);
      return res.status(400).json({ message: 'Domain already exists' });
    }

    console.log(`Creating domain record: ${domain}`);
    // Create a domain record
    const domainRecord = new Domain({
      domain: domain,
      isDefault: false
    });
    
    await domainRecord.save();
    console.log(`Domain record created for domain: ${domain}`);

    console.log(`Domain ${domain} added successfully`);
    return res.status(201).json({
      message: 'Domain added successfully',
      domain
    });
  } catch (error) {
    console.error('Add domain error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all account classifications
export const getAccountClassifications = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('Fetching all account classifications');
    // Get all categories from the Category collection
    const categories = await Category.find({}, { name: 1 });
    
    console.log(`Found ${categories.length} classifications`);
    const classifications = categories.map(category => category.name);
    console.log('Classification list:', classifications);

    return res.status(200).json({
      classifications: classifications.map(c => ({ classification: c }))
    });
  } catch (error) {
    console.error('Get account classifications error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Add a new account classification
export const addAccountClassification = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { classification } = req.body;
    console.log(`Received request to add classification: ${classification}`);

    // Validate input
    if (!classification) {
      console.log('Classification validation failed: classification is required');
      return res.status(400).json({ message: 'Classification is required' });
    }

    // Check if classification already exists
    const existingClassification = await Category.findOne({
      name: classification
    });

    if (existingClassification) {
      console.log(`Classification ${classification} already exists`);
      return res.status(400).json({ message: 'Classification already exists' });
    }

    console.log(`Creating category record: ${classification}`);
    // Create a category record
    const categoryRecord = new Category({
      name: classification
    });

    await categoryRecord.save();
    console.log(`Category record created for classification: ${classification}`);

    console.log(`Classification ${classification} added successfully`);
    return res.status(201).json({
      message: 'Classification added successfully',
      classification
    });
  } catch (error) {
    console.error('Add classification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update order status
export const updateOrderStatus = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Find order by ID
    const order = await Order.findById(id).populate('items.product').populate('user');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Store previous status
    const previousStatus = order.status;

    // Update order status
    order.status = status;
    await order.save();

    // If status changed to 'delivered', send purchase emails
    if (previousStatus !== 'delivered' && status === 'delivered') {
      try {
        // Get user details
        const user = await User.findById(order.user);
        if (user) {
          // Get product details
          const productIds = order.items.map((item: any) => item.product._id);
          const products: IProduct[] = await Product.find({ '_id': { $in: productIds } });
          
          // Send purchase emails
          await sendPurchaseEmails(user, order, products);
        }
      } catch (emailError) {
        console.error('Failed to send purchase emails:', emailError);
        // Don't fail the status update if emails fail to send
      }
    }

    return res.status(200).json({ 
      message: 'Order status updated successfully',
      order 
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
