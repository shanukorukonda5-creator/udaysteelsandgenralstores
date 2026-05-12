import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [animating, setAnimating] = useState(false);
  const [animPos, setAnimPos] = useState({ x: 0, y: 0 });

  const fetchCart = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/cart');
      setCart(res.data);
    } catch {}
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, e) => {
    if (!user) return false;
    if (e) {
      const rect = e.target.getBoundingClientRect();
      setAnimPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    setAnimating(true);
    setTimeout(() => setAnimating(false), 2500);
    try {
      const res = await axios.post('/api/cart/add', { productId });
      setCart(res.data);
      return true;
    } catch { return false; }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await axios.delete(`/api/cart/remove/${productId}`);
      setCart(res.data);
    } catch {}
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await axios.put(`/api/cart/update/${productId}`, { quantity });
      setCart(res.data);
    } catch {}
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, cartCount, cartTotal, fetchCart, animating, animPos }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
