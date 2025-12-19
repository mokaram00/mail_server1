import mongoose, { Document, Schema, Model } from 'mongoose';
import { adminConnection } from '../config/mongoDb'; // Use admin connection

// Define the interface for Category document
export interface ICategory extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Category schema
const CategorySchema: Schema<ICategory> = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create and export the Category model using admin connection
const Category: Model<ICategory> = adminConnection.model<ICategory>('Category', CategorySchema);

export default Category;