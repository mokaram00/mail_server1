import mongoose, { Document, Schema, Model } from 'mongoose';
import { adminConnection } from '../config/mongoDb'; // Use admin connection

// Define the interface for Admin document
export interface IAdmin extends Document {
  username: string;
  email: string;
  password: string;
  role: 'superadmin' | 'admin';
  isActive: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Define the Admin schema
const AdminSchema: Schema<IAdmin> = new Schema({
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
    enum: ['superadmin', 'admin'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: [{
    type: String
  }]
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create and export the Admin model using admin connection
const Admin: Model<IAdmin> = adminConnection.model<IAdmin>('Admin', AdminSchema);

export default Admin;