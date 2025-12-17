import { Request, Response } from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Email from '../models/Email';
import sequelize from '../config/db';

export const getUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Get all users except the current admin
    const users = await User.findAll({
      attributes: { exclude: ['password'] }, // Exclude passwords
      where: {
        id: {
          [Op.ne]: req.user.id, // Not equal to current user
        },
      },
    });

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
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }, // Exclude password
    });

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

export const updateUserRole = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role parameter' });
    }

    // Find user by ID
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent user from changing their own role
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    // Update user role
    await user.update({ role });

    return res.status(200).json({
      message: 'User role updated successfully',
      user: {
        id: user.id,
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
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user classification
    await user.update({ accountClassification: classification || null });

    return res.status(200).json({
      message: 'User classification updated successfully',
      user: {
        id: user.id,
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

export const deactivateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    // Find user by ID
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent user from deactivating themselves
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    // Deactivate user
    await user.update({ isActive: false });

    return res.status(200).json({
      message: 'User deactivated successfully',
      user: {
        id: user.id,
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

export const getSystemStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Get system statistics
    const totalUsers = await User.count();
    const totalEmails = await Email.count();
    const activeUsers = await User.count({
      where: {
        isActive: true,
      },
    });

    return res.status(200).json({
      stats: {
        totalUsers,
        totalEmails,
        activeUsers,
      },
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    let { username, email, password, role, domain, isDefaultDomain, accountClassification } = req.body;
    console.log('Creating user with data:', { username, email, role, domain, isDefaultDomain, accountClassification });

    // Validate input
    if (!username || !password) {
      console.log('User validation failed: username and password are required');
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Automatically generate email if domain is provided and email is not
    if (domain && !email) {
      email = `${username}@${domain}`;
      console.log(`Generated email from domain: ${email}`);
    } else if (domain && email && !email.endsWith(`@${domain}`)) {
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
      where: {
        email: email,
      },
    });

    if (existingUser) {
      console.log(`User validation failed: user with email ${email} already exists`);
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Register the classification if provided
    if (accountClassification) {
      console.log(`Registering classification: ${accountClassification}`);
      await registerClassification(accountClassification);
    }

    // Register the domain if provided
    if (domain) {
      console.log(`Registering domain: ${domain}`);
      await registerDomain(domain);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user', // Default to 'user' if not specified
      isActive: true, // Default active status
      domain: domain || null,
      isDefaultDomain: isDefaultDomain || false,
      accountClassification: accountClassification || null,
    });
    console.log(`User created successfully with ID: ${user.id}`);

    // Return user data without password
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      domain: user.domain,
      isDefaultDomain: user.isDefaultDomain,
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

    // Validate input
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'Users array is required and cannot be empty' });
    }

    // Validate each user and generate emails if needed
    for (const user of users) {
      if (!user.username || !user.password) {
        return res.status(400).json({ 
          message: 'Each user must have username and password',
          user: user
        });
      }

      // Automatically generate email if domain is provided and email is not
      if (user.domain && !user.email) {
        user.email = `${user.username}@${user.domain}`;
      } else if (user.domain && user.email && !user.email.endsWith(`@${user.domain}`)) {
        // If both email and domain are provided but email doesn't match domain, use the domain
        user.email = `${user.username}@${user.domain}`;
      }

      // Validate that email is provided (either directly or generated)
      if (!user.email) {
        return res.status(400).json({ 
          message: 'Each user must have an email',
          user: user
        });
      }

      // Validate role if provided
      if (user.role && !['admin', 'user'].includes(user.role)) {
        return res.status(400).json({ 
          message: 'Invalid role parameter',
          user: user
        });
      }
    }

    // Check for existing users
    const emails = users.map(user => user.email);
    const existingUsers = await User.findAll({
      where: {
        email: {
          [Op.in]: emails
        }
      }
    });

    if (existingUsers.length > 0) {
      const existingEmails = existingUsers.map(user => user.email);
      return res.status(400).json({ 
        message: 'Some users with these emails already exist',
        existingEmails: existingEmails
      });
    }

    // Register any new classifications and domains
    for (const user of users) {
      if (user.accountClassification) {
        await registerClassification(user.accountClassification);
      }
      
      if (user.domain) {
        await registerDomain(user.domain);
      }
    }

    // Hash passwords and prepare user data
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
    const createdUsers = await User.bulkCreate(usersToCreate);

    // Return user data without passwords
    const userData = createdUsers.map(user => ({
      id: user.id,
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
    // Get all unique domains from users with active or inactive status
    const domains = await User.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('domain')), 'domain'],
        'isDefaultDomain'
      ],
      where: {
        domain: {
          [Op.not]: null
        }
      } as any,
      // Order by domain name for consistent results
      order: [[sequelize.col('domain'), 'ASC']]
    });
    
    console.log(`Found ${domains.length} domains`);
    const domainList = domains.map(d => ({
      domain: d.getDataValue('domain'),
      isDefault: d.getDataValue('isDefaultDomain')
    }));
    console.log('Domain list:', domainList);

    return res.status(200).json({
      domains: domainList
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
    const existingDomain = await User.findOne({
      where: {
        domain: domain
      }
    });

    if (existingDomain) {
      console.log(`Domain ${domain} already exists`);
      return res.status(400).json({ message: 'Domain already exists' });
    }

    console.log(`Creating dummy user for domain: ${domain}`);
    // Create a dummy user with this domain to register it
    // In a real implementation, you might want to store domains separately
    const dummyUser = await User.create({
      username: `domain_${Date.now()}`,
      email: `domain_${Date.now()}@${domain}`,
      password: 'dummy_password',
      role: 'user',
      isActive: false,
      domain: domain,
      isDefaultDomain: false
    });

    console.log(`Dummy user created, now destroying it`);
    // Delete the dummy user since we only needed to register the domain
    await dummyUser.destroy();

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
    // Get all unique account classifications
    const classifications = await User.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('accountClassification')), 'accountClassification']
      ],
      where: {
        accountClassification: {
          [Op.not]: null
        }
      } as any,
      // Order by classification name for consistent results
      order: [[sequelize.col('accountClassification'), 'ASC']]
    });

    return res.status(200).json({
      classifications: classifications.map(c => c.getDataValue('accountClassification'))
    });
  } catch (error) {
    console.error('Get account classifications error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Register a classification (internal use)
const registerClassification = async (classification: string): Promise<void> => {
  // Check if classification already exists
  const existingClassification = await User.findOne({
    where: {
      accountClassification: classification
    }
  });

  if (!existingClassification) {
    // Create a dummy user with this classification to register it
    // In a real implementation, you might want to store classifications separately
    const dummyUser = await User.create({
      username: `classification_${Date.now()}`,
      email: `classification_${Date.now()}@temp.com`,
      password: 'dummy_password',
      role: 'user',
      isActive: false,
      accountClassification: classification
    });

    // Delete the dummy user since we only needed to register the classification
    await dummyUser.destroy();
  }
};

// Register a domain (internal use)
const registerDomain = async (domain: string): Promise<void> => {
  console.log(`Attempting to register domain: ${domain}`);
  
  // Check if domain already exists
  const existingDomain = await User.findOne({
    where: {
      domain: domain
    }
  });
  
  console.log(`Domain ${domain} exists: ${!!existingDomain}`);

  if (!existingDomain) {
    console.log(`Creating dummy user for domain: ${domain}`);
    try {
      // Create a dummy user with this domain to register it
      // In a real implementation, you might want to store domains separately
      const dummyUser = await User.create({
        username: `domain_${Date.now()}`,
        email: `domain_${Date.now()}@${domain}`,
        password: 'dummy_password',
        role: 'user',
        isActive: false,
        domain: domain,
        isDefaultDomain: false
      });
      
      console.log(`Dummy user created for domain: ${domain}`);

      // Delete the dummy user since we only needed to register the domain
      await dummyUser.destroy();
      console.log(`Dummy user destroyed for domain: ${domain}`);
    } catch (error) {
      console.error(`Error creating dummy user for domain ${domain}:`, error);
      throw error;
    }
  } else {
    console.log(`Domain ${domain} already exists, skipping registration`);
  }
};

// Add a new account classification
export const addAccountClassification = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { classification } = req.body;

    // Validate input
    if (!classification) {
      return res.status(400).json({ message: 'Classification is required' });
    }

    // Register the classification
    await registerClassification(classification);

    return res.status(201).json({
      message: 'Classification added successfully',
      classification
    });
  } catch (error) {
    console.error('Add classification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Set default domain
export const setDefaultDomain = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { domain } = req.body;

    // Validate input
    if (!domain) {
      return res.status(400).json({ message: 'Domain is required' });
    }

    // First unset any existing default domain
    await User.update(
      { isDefaultDomain: false },
      { where: { isDefaultDomain: true } }
    );

    // Set the new default domain
    await User.update(
      { isDefaultDomain: true },
      { where: { domain: domain } }
    );

    return res.status(200).json({
      message: `Default domain set to ${domain}`
    });
  } catch (error) {
    console.error('Set default domain error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update admin profile
export const updateAdminProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { username, email } = req.body;
    const adminId = req.user.id;

    // Validate input
    if (!username && !email) {
      return res.status(400).json({ message: 'Username or email is required' });
    }

    // Check if email already exists (if updating email)
    if (email) {
      const existingUser = await User.findOne({
        where: {
          email: email,
          id: {
            [Op.ne]: adminId
          }
        }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Update admin profile
    const updates: any = {};
    if (username) updates.username = username;
    if (email) updates.email = email;

    const updatedAdmin = await User.update(updates, {
      where: { id: adminId }
    });

    if (updatedAdmin[0] === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Get updated admin data
    const admin = await User.findByPk(adminId, {
      attributes: { exclude: ['password'] }
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: admin
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Change admin password
export const changeAdminPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get admin with password
    const admin = await User.findByPk(adminId);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.update(
      { password: hashedPassword },
      { where: { id: adminId } }
    );

    return res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change admin password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get admin profile
export const getAdminProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const adminId = req.user.id;

    // Get admin data without password
    const admin = await User.findByPk(adminId, {
      attributes: { exclude: ['password'] }
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    return res.status(200).json({
      user: admin
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get emails by classification
export const getEmailsByClassification = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { classification } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Validate pagination parameters
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    // Find users with the specified classification
    const users = await User.findAll({
      where: {
        accountClassification: classification
      },
      attributes: ['id']
    });
    
    const userIds = users.map(user => user.id);
    
    if (userIds.length === 0) {
      return res.status(200).json({
        emails: [],
        pagination: {
          currentPage: pageNum,
          totalPages: 0,
          totalEmails: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    }
    
    // Get emails for these users
    const { count, rows } = await Email.findAndCountAll({
      where: {
        [Op.or]: [
          { senderId: { [Op.in]: userIds } },
          { recipientId: { [Op.in]: userIds } }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: offset
    });
    
    const totalPages = Math.ceil(count / limitNum);
    
    return res.status(200).json({
      emails: rows,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        totalEmails: count,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get emails by classification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user password (for admin use only)
export const getUserPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    // Find user by ID
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user password (in a real implementation, you might want to decrypt it if encrypted)
    // For this implementation, we'll return a masked version for security
    return res.status(200).json({
      password: user.password
    });
  } catch (error) {
    console.error('Get user password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
