'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item._id === action.payload._id);

      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item._id === action.payload._id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
        return {
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
          itemCount: updatedItems.reduce((count, item) => count + item.quantity, 0),
        };
      } else {
        const newItems = [...state.items, action.payload];
        return {
          items: newItems,
          total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
          itemCount: newItems.reduce((count, item) => count + item.quantity, 0),
        };
      }
    }

    case 'REMOVE_ITEM': {
      const filteredItems = state.items.filter(item => item._id !== action.payload.id);
      return {
        items: filteredItems,
        total: filteredItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        itemCount: filteredItems.reduce((count, item) => count + item.quantity, 0),
      };
    }

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { id: action.payload.id } });
      }

      const updatedItems = state.items.map(item =>
        item._id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return {
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        itemCount: updatedItems.reduce((count, item) => count + item.quantity, 0),
      };
    }

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
}

const CartContext = createContext<{
  state: CartState;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
} | null>(null);

// Cross-subdomain localStorage functions
const CART_STORAGE_KEY = 'bltnm_cart';

const getCrossDomainCart = (): CartState => {
  try {
    // Try to get from current domain first
    const localCart = localStorage.getItem(CART_STORAGE_KEY);
    if (localCart) {
      return JSON.parse(localCart);
    }
    
    // Try to get from cookie as fallback (for cross-domain access)
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === CART_STORAGE_KEY) {
        return JSON.parse(decodeURIComponent(value));
      }
    }
    
    return initialState;
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return initialState;
  }
};

const saveCrossDomainCart = (cartState: CartState) => {
  try {
    // Save to localStorage
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
    
    // Also save to cookie for cross-domain access (expires in 30 days)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    document.cookie = `${CART_STORAGE_KEY}=${encodeURIComponent(JSON.stringify(cartState))}; expires=${expirationDate.toUTCString()}; path=/; domain=.bltnm.store; SameSite=None; Secure`;
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from cross-domain storage
  useEffect(() => {
    const savedCart = getCrossDomainCart();
    if (savedCart && savedCart.items.length > 0) {
      savedCart.items.forEach((item: CartItem) => {
        dispatch({ type: 'ADD_ITEM', payload: item });
      });
    }
  }, []);

  // Save cart to cross-domain storage when it changes
  useEffect(() => {
    if (state.items.length > 0 || initialState !== state) {
      saveCrossDomainCart(state);
    }
  }, [state]);

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { ...item, quantity: item.quantity || 1 }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cart:add', {
          detail: {
            itemId: item._id,
            quantity: item.quantity || 1
          }
        })
      );
    }
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}