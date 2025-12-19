import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;

  // Supabase user data (required for Supabase users)
  supabaseId?: string;
  email: string;
  fullName?: string;

  // Legacy fields for backward compatibility (optional for Supabase users)
  name?: string;
  password?: string;

  // User profile data
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  // Role and permissions
  role: 'admin' | 'customer';

  // Account status
  isActive: boolean;
  emailVerified: boolean;

  // Profile image
  avatar?: string;

  // Preferences
  preferences: {
    language: 'ar' | 'en';
    currency: 'SAR' | 'USD';
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };

  // Metadata
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  updateLastLogin(): Promise<void>;
}

const UserSchema = new Schema<IUser>({
  // Supabase fields (required for Supabase authentication)
  supabaseId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Required fields for all users
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  fullName: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  // Legacy fields for backward compatibility
  name: {
    type: String,
    trim: true,
  },

  password: {
    type: String,
  },

  // Profile data
  phone: {
    type: String,
    trim: true
  },

  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'Saudi Arabia'
    }
  },

  // Role and permissions
  role: {
    type: String,
    enum: ['admin', 'customer'],
    default: 'customer'
  },

  // Account status
  isActive: {
    type: Boolean,
    default: true
  },

  emailVerified: {
    type: Boolean,
    default: false
  },

  // Profile image
  avatar: {
    type: String,
  },

  // Preferences
  preferences: {
    language: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar'
    },
    currency: {
      type: String,
      enum: ['SAR', 'USD'],
      default: 'SAR'
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    }
  },

  // Metadata
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
UserSchema.index({ role: 1 });

// Virtual for full profile
UserSchema.virtual('profile').get(function () {
  return {
    id: this._id,
    supabaseId: this.supabaseId,
    email: this.email,
    fullName: this.fullName || this.name,
    phone: this.phone,
    address: this.address,
    role: this.role,
    avatar: this.avatar,
    preferences: this.preferences,
    isActive: this.isActive,
    emailVerified: this.emailVerified,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
});

// Static method to find user by Supabase ID
UserSchema.statics.findBySupabaseId = function (supabaseId: string) {
  return this.findOne({ supabaseId });
};

// Static method to find user by email
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Instance method to update last login
UserSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// Pre-save middleware to update updatedAt
UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to hash password only if it exists and is modified
UserSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
