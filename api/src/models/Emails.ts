import mongoose, { Document, Schema, Model } from 'mongoose';
import { userConnection } from '../config/mongoDb'; // Use user connection

// Define the interface for Emails document
export interface IEmails extends Document {
  username: string;
  email: string;
  password: string;
  isActive: boolean;
  isConnected?: boolean; // New field to track connection status
  domain?: string;
  accountClassification?: string;
  description?: string;  // Optional description field
  createdAt: Date;
  updatedAt: Date;
}

// Define the Emails schema
const EmailsSchema: Schema<IEmails> = new Schema({
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
  },
  isConnected: {
    type: Boolean,
    default: false // Default to false (not connected)
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create and export the Emails model using user connection
const Emails: Model<IEmails> = userConnection.model<IEmails>('Emails', EmailsSchema);

export default Emails;