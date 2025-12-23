import { adminConnection } from '../config/mongoDb';
import { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  stock: number;
  featured: boolean;
  images: string[];
  productType?: string; // 'accounts' or 'other'
  selectedEmails?: string[]; // Array of email IDs for accounts product type
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  images: [{
    type: String
  }],
  productType: {
    type: String,
    enum: ['accounts', 'other'],
    default: 'other'
  },
  selectedEmails: [{
    type: String
  }],

}, {
  timestamps: true
});

// Indexes for better performance
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ productType: 1 });

export default adminConnection.models.Product || adminConnection.model<IProduct>('Product', ProductSchema);