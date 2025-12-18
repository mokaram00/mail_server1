import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';
import User from '../models/User';
import Email from '../models/Email';
import Domain from '../models/Domain';
import Category from '../models/Category';

// Extend the Request type to include admin property
interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    role: string;
  };
  user?: any; // Keep for backward compatibility
}

// Register a domain (internal use)
const registerDomain = async (domain: string): Promise<void> => {
  console.log(`Attempting to register domain: ${domain}`);
  
  // Don't register empty domains
  if (!domain || domain.trim() === '') {
    console.log('Skipping domain registration for empty domain');
    return;
  }
  
  // Check if domain already exists
  const existingDomain = await Domain.findOne({
    domain: domain
  });
  
  console.log(`Domain ${domain} exists: ${!!existingDomain}`);

  if (!existingDomain) {
    console.log(`Creating domain record: ${domain}`);
    try {
      // Create a domain record
      const domainRecord = new Domain({
        domain: domain,
        isDefault: false
      });
      
      await domainRecord.save();
      console.log(`Domain record created for domain: ${domain}`);
    } catch (error) {
      console.error(`Error creating domain record for domain ${domain}:`, error);
      throw error;
    }
  } else {
    console.log(`Domain ${domain} already exists, skipping registration`);
  }
};

// Register a classification (internal use)
const registerClassification = async (classification: string): Promise<void> => {
  console.log(`Attempting to register classification: ${classification}`);
  
  // Don't register empty classifications
  if (!classification || classification.trim() === '') {
    console.log('Skipping classification registration for empty classification');
    return;
  }
  
  // Check if classification already exists
  const existingClassification = await Category.findOne({
    name: classification
  });
  
  console.log(`Classification ${classification} exists: ${!!existingClassification}`);

  if (!existingClassification) {
    console.log(`Creating category record: ${classification}`);
    try {
      // Create a category record
      const categoryRecord = new Category({
        name: classification
      });

      await categoryRecord.save();
      console.log(`Category record created for classification: ${classification}`);
    } catch (error) {
      console.error(`Error creating category record for classification ${classification}:`, error);
      throw error;
    }
  } else {
    console.log(`Classification ${classification} already exists, skipping registration`);
  }
};

export const getUsers = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Get all users except the current admin and except permanent classification/domain users
    const users = await User.find({
      _id: { $ne: req.admin?.id }, // Not equal to current admin
      username: { 
        $not: { 
          $regex: /^(classification_|domain_)/ 
        } 
      } // Exclude permanent classification and domain users
    }).select('-password'); // Exclude passwords

    return res.status(200).json({
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    // Find user by ID
    const user = await User.findById(id).select('-password'); // Exclude password

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

export const updateUserRole = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role parameter' });
    }

    // Find user by ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent user from changing their own role
    if (user._id.toString() === req.admin?.id) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    // Update user role
    user.role = role as 'admin' | 'user';
    await user.save();

    return res.status(200).json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
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
    const user = await User.findById(id);

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
    const user = await User.findById(id);

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
      },
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSystemStats = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Get system statistics excluding permanent classification/domain users
    const totalUsers = await User.countDocuments({
      username: { 
        $not: { 
          $regex: /^(classification_|domain_)/ 
        } 
      }
    });
    const totalEmails = await Email.countDocuments();
    const activeUsers = await User.countDocuments({
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

export const createUser = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    let { username, email, password, role, domain, isDefaultDomain, accountClassification } = req.body;
    console.log('Creating user with data:', { username, email, role, domain, isDefaultDomain, accountClassification });

    // Validate input
    if (!username || !password) {
      console.log('User validation failed: username and password are required');
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Handle empty strings for domain and accountClassification
    if (domain === '') domain = null;
    if (accountClassification === '') accountClassification = null;

    // Automatically generate email if domain is provided and email is not
    if (domain && domain.trim() !== '' && !email) {
      email = `${username}@${domain}`;
      console.log(`Generated email from domain: ${email}`);
    } else if (domain && domain.trim() !== '' && email && !email.endsWith(`@${domain}`)) {
      // If both email and domain are provided but email doesn't match domain, use the domain
      email = `${username}@${domain}`;
      console.log(`Overrode email with domain-based email: ${email}`);
    }

    // Validate that email is provided (either directly or generated)
    if (!email) {
      console.log('Email validation failed: email is required');
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate role
    if (role && !['admin', 'user'].includes(role)) {
      console.log(`Role validation failed: invalid role ${role}`);
      return res.status(400).json({ message: 'Invalid role parameter' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      email: email,
    });

    if (existingUser) {
      console.log(`User validation failed: user with email ${email} already exists`);
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if the classification exists in the Category collection
    if (accountClassification && accountClassification.trim() !== '') {
      const existingClassification = await Category.findOne({
        name: accountClassification
      });

      if (!existingClassification) {
        console.log(`Classification ${accountClassification} does not exist`);
        return res.status(400).json({ message: `Classification '${accountClassification}' does not exist` });
      }
    }

    // Check if the domain exists in the Domain collection
    if (domain && domain.trim() !== '') {
      const existingDomain = await Domain.findOne({
        domain: domain
      });

      if (!existingDomain) {
        console.log(`Domain ${domain} does not exist`);
        return res.status(400).json({ message: `Domain '${domain}' does not exist` });
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'user', // Default to 'user' if not specified
      isActive: true, // Default active status
      domain: domain || null,
      isDefaultDomain: isDefaultDomain || false,
      accountClassification: accountClassification || null,
    });
    
    await user.save();
    console.log(`User created successfully with ID: ${user._id}`);

    // Return user data without password
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
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

// Bulk create users
export const bulkCreateUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { users } = req.body;
    console.log(`Bulk creating ${users.length} users`);

    // Validate input
    if (!Array.isArray(users) || users.length === 0) {
      console.log('Bulk create validation failed: users array is required and cannot be empty');
      return res.status(400).json({ message: 'Users array is required and cannot be empty' });
    }

    // Validate each user and generate emails if needed
    for (const user of users) {
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

      // Validate role if provided
      if (user.role && !['admin', 'user'].includes(user.role)) {
        console.log(`Role validation failed for user ${user.username}: invalid role ${user.role}`);
        return res.status(400).json({ 
          message: 'Invalid role parameter',
          user: user
        });
      }
    }

    // Check for existing users
    const emails = users.map(user => user.email);
    console.log('Checking for existing users with emails:', emails);
    const existingUsers = await User.find({
      email: {
        $in: emails
      }
    });

    if (existingUsers.length > 0) {
      const existingEmails = existingUsers.map(user => user.email);
      console.log('Existing users found with emails:', existingEmails);
      return res.status(400).json({ 
        message: 'Some users with these emails already exist',
        existingEmails: existingEmails
      });
    }

    // Check if all classifications and domains exist
    console.log('Checking classifications and domains');
    for (const user of users) {
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
    console.log('Hashing passwords and preparing user data');
    const usersToCreate = [];
    for (const user of users) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      
      usersToCreate.push({
        username: user.username,
        email: user.email,
        password: hashedPassword,
        role: user.role || 'user',
        isActive: true,
        domain: user.domain || null,
        isDefaultDomain: user.isDefaultDomain || false,
        accountClassification: user.accountClassification || null,
      });
    }

    // Create all users
    console.log('Creating users');
    const createdUsers = await User.insertMany(usersToCreate);
    console.log(`Created ${createdUsers.length} users successfully`);

    // Return user data without passwords
    const userData = createdUsers.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      domain: user.domain,
      isDefaultDomain: user.isDefaultDomain,
      accountClassification: user.accountClassification,
    }));

    return res.status(201).json({
      message: `${createdUsers.length} users created successfully`,
      users: userData,
    });
  } catch (error) {
    console.error('Bulk create users error:', error);
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

// Get emails by classification
export const getEmailsByClassification = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { classification } = req.params;
    const { domain } = req.query;
    
    console.log(`Fetching emails for classification: ${classification} with domain filter: ${domain}`);

    // Check if the classification exists
    const existingClassification = await Category.findOne({
      name: classification
    });

    if (!existingClassification) {
      console.log(`Classification ${classification} does not exist`);
      return res.status(400).json({ message: `Classification '${classification}' does not exist` });
    }

    // Find users with the specified classification
    const userQuery: any = { 
      accountClassification: classification
    };
    if (domain) {
      // Check if the domain exists
      const existingDomain = await Domain.findOne({
        domain: domain
      });

      if (!existingDomain) {
        console.log(`Domain ${domain} does not exist`);
        return res.status(400).json({ message: `Domain '${domain}' does not exist` });
      }
      
      userQuery.domain = domain;
    }
    
    const users = await User.find(userQuery, { email: 1, username: 1, password: 1, domain: 1 });

    console.log(`Found ${users.length} users with classification ${classification}`);

    return res.status(200).json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        password: user.password, // Include actual password as requested
        domain: user.domain
      }))
    });
  } catch (error) {
    console.error('Get emails by classification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};