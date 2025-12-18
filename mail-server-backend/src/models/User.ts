import mongoose, { Document, Schema, Model } from 'mongoose';
import { userConnection } from '../config/mongoDb'; // Use user connection

// Define the interface for User document
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  isActive: boolean;
  domain?: string;
  isDefaultDomain?: boolean;
  accountClassification?: string;
  pop3Host?: string;
  pop3Port?: number;
  pop3User?: string;
  pop3Password?: string;
  pop3TLS?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the User schema
const UserSchema: Schema<IUser> = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  domain: {
    type: String,
    trim: true
  },
  isDefaultDomain: {
    type: Boolean,
    default: false
  },
  accountClassification: {
    type: String,
    trim: true
  },
  pop3Host: {
    type: String,
    trim: true
  },
  pop3Port: {
    type: Number
  },
  pop3User: {
    type: String,
    trim: true
  },
  pop3Password: {
    type: String
  },
  pop3TLS: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create and export the User model using user connection
const User: Model<IUser> = userConnection.model<IUser>('User', UserSchema);

export default User;