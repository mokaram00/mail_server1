import mongoose, { Document, Schema, Model } from 'mongoose';
import { userConnection } from '../config/mongoDb'; // Use user connection

// Define the interface for User document
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  isActive: boolean;
  domain?: string;
  accountClassification?: string;
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
  isActive: {
    type: Boolean,
    default: true
  },
  domain: {
    type: String,
    trim: true
  },
  accountClassification: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create and export the User model using user connection
const User: Model<IUser> = userConnection.model<IUser>('User', UserSchema);

export default User;