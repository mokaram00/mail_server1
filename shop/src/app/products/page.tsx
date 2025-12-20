'use client';

import { useState } from 'react';

export default function ProductsPage() {
  const [products] = useState([
    {
      id: 1,
      name: 'Premium Widget',
      price: 29.99,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      description: 'High-quality widget designed for everyday use.',
    },
    {
      id: 2,
      name: 'Deluxe Gadget',
      price: 49.99,
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      description: 'Advanced gadget with premium features.',
    },
    {
      id: 3,
      name: 'Standard Tool',
      price: 19.99,
      image: 'https://images.unsplash.com/photo-1585155770447-2f66e2a397b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      description: 'Reliable tool for professional use.',
    },
    {
      id: 4,
      name: 'Luxury Accessory',
      price: 99.99,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
      description: 'Exclusive accessory for discerning customers.',
    },
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Our Products</h1>
        <p className="mt-4 text-lg text-gray-600">
          Discover our collection of high-quality tools and accessories
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-64 object-cover object-center"
              />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
              <p className="mt-2 text-sm text-gray-600">{product.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900">${product.price.toFixed(2)}</span>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}