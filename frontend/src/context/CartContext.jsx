import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getCart,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
} from '../api/cart';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    totalQuantity: 0,
  });
  const [loading, setLoading] = useState(false);
  const [cartError, setCartError] = useState('');

  const fetchCart = async () => {
    if (!token) {
      setCart({ items: [], subtotal: 0, totalQuantity: 0 });
      return;
    }
    setLoading(true);
    try {
      const res = await getCart();
      if (res?.data?.cart) {
        setCart(res.data.cart);
      }
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  const addToCart = async (productId, quantity = 1) => {
    if (!token) {
      return { success: false, requireLogin: true, message: 'Please log in to add items to your cart.' };
    }
    setLoading(true);
    setCartError('');
    try {
      const res = await addToCartApi(productId, quantity);
      if (res?.data?.cart) {
        setCart(res.data.cart);
      }
      return { success: true, message: 'Item added to cart!' };
    } catch (err) {
      const msg = err?.message || err?.errors?.join(', ') || 'Failed to add item to cart';
      setCartError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity <= 0) {
      return removeItem(cartItemId);
    }
    setLoading(true);
    setCartError('');
    try {
      const res = await updateCartItemApi(cartItemId, quantity);
      if (res?.data?.cart) {
        setCart(res.data.cart);
      }
      return { success: true };
    } catch (err) {
      const msg = err?.message || 'Failed to update quantity';
      setCartError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (cartItemId) => {
    setLoading(true);
    setCartError('');
    try {
      const res = await removeCartItemApi(cartItemId);
      if (res?.data?.cart) {
        setCart(res.data.cart);
      }
      return { success: true, message: 'Item removed' };
    } catch (err) {
      const msg = err?.message || 'Failed to remove item';
      setCartError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    setCartError('');
    try {
      const res = await clearCartApi();
      if (res?.data?.cart) {
        setCart(res.data.cart);
      } else {
        setCart({ items: [], subtotal: 0, totalQuantity: 0 });
      }
      return { success: true };
    } catch (err) {
      const msg = err?.message || 'Failed to clear cart';
      setCartError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        items: cart.items || [],
        subtotal: cart.subtotal || 0,
        totalQuantity: cart.totalQuantity || 0,
        loading,
        cartError,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
