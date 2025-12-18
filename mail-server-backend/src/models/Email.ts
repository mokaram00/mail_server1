import mongoose, { Document, Schema, Model } from 'mongoose';
import { userConnection } from '../config/mongoDb'; // Use user connection like User model

// Define the interface for Email document
export interface IEmail extends Document {
  senderId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  subject: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  folder: 'inbox';  // Only 'inbox' allowed
  messageId?: string;
  fromAddress?: string;
  toAddress?: string;
  receivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Email schema
const EmailSchema: Schema<IEmail> = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  folder: {
    type: String,
    default: 'inbox'  // Only 'inbox' as the default folder
  },
  messageId: {
    type: String,
    trim: true
  },
  fromAddress: {
    type: String,
    trim: true
  },
  toAddress: {
    type: String,
    trim: true
  },
  receivedAt: {
    type: Date
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create and export the Email model using user connection
const Email: Model<IEmail> = userConnection.model<IEmail>('Email', EmailSchema);

export default Email;
