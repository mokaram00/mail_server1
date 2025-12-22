import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { userConnection } from '../config/mongoDb'; // Use user connection

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  fullName: string; // Make this required as it's the main field we use
  
  // Legacy fields for backward compatibility (optional for Supabase users)
  name?: string;
  password: string; // Make this required as all users need a password
  
  // Account status
  isActive: boolean;

  // Profile image
  avatar?: string;
  
  emailVerified: boolean;

  // Metadata
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  updateLastLogin(): Promise<void>;
}

const UserSchema = new Schema<IUser>({
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
    trim: true
  },

  // Legacy fields for backward compatibility
  name: {
    type: String,
    trim: true,
  },

  password: {
    type: String,
    required: true, // Make this required
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },

  // Profile image
  avatar: {
    type: String,
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
    email: this.email,
    fullName: this.fullName || this.name || '', // Ensure we always have a value
    avatar: this.avatar,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
});

// Ensure the virtual fields are serialized
UserSchema.set('toJSON', {
  virtuals: true
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

// Create and export the User model using user connection
const User: Model<IUser> = userConnection.model<IUser>('User', UserSchema);

export { User };