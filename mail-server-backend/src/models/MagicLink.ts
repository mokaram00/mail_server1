import mongoose, { Document, Schema, Model } from 'mongoose';
import { userConnection } from '../config/mongoDb'; // Use user connection

// Define the interface for MagicLink document
export interface IMagicLink extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

// Define the MagicLink schema
const MagicLinkSchema: Schema<IMagicLink> = new Schema({
  userId: {
    type: String,
    required: true,
    ref: 'Emails'
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create and export the MagicLink model using user connection
const MagicLink: Model<IMagicLink> = userConnection.model<IMagicLink>('MagicLink', MagicLinkSchema);

export default MagicLink;