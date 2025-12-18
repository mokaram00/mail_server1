import mongoose, { Document, Schema, Model } from 'mongoose';
import { adminConnection } from '../config/mongoDb'; // Use admin connection

// Define the interface for Domain document
export interface IDomain extends Document {
  domain: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Domain schema
const DomainSchema: Schema<IDomain> = new Schema({
  domain: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create and export the Domain model using admin connection
const Domain: Model<IDomain> = adminConnection.model<IDomain>('Domain', DomainSchema);

export default Domain;