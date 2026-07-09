"use client";
import React from 'react';
import { useCart } from './context/CartContext'; 
import ToastNotification from './NotificationToast';

export default function GlobalToast() {
  const { toast, closeToast } = useCart();

  return (
    <ToastNotification 
      message={toast.message} 
      visible={toast.visible} 
      onClose={closeToast} 
    />
  );
}