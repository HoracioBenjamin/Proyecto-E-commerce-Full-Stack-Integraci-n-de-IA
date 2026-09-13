"use client";
import React, { useState } from 'react';
import { IconButton, CircularProgress, Tooltip } from '@mui/material';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useCart } from '../components/context/CartContext';

export default function AddToCartButton({ producto, tallaSeleccionada }) {
  const { addToCart, toggleCart } = useCart();
  const [loading, setLoading] = useState(false);

  // Buscamos el stock real para la talla que recibimos
  const infoStock = producto.stock?.find(s => s.talla === tallaSeleccionada);
  const tieneStock = infoStock && infoStock.cantidad > 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!tallaSeleccionada || !tieneStock || loading) return;

    setLoading(true);

    try {
      // 1. Calculamos el precio que se paga efectivamente
      const precioFinal = producto.en_oferta ? producto.precio_oferta : producto.precio;

      // 2. ENVIAMOS TODO AL CARRITO
      await addToCart({
        id: producto.id,
        name: producto.nombre,
        img: producto.imagen_url,
        size: tallaSeleccionada,
        stockMaximo: infoStock.cantidad,
        stockCompleto: producto.stock,
        
        // --- ESTAS TRES LÍNEAS ACTIVAN EL COLOR ROJO ---
        en_oferta: producto.en_oferta,       // true o false
        precio_normal: producto.precio,      // El precio tachado
        price_raw: precioFinal              // El precio que se suma al total
      });

      toggleCart(true);
    } catch (error) {
      console.error("Error al añadir:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={!tieneStock ? "Agotado" : "Añadir a la bolsa"}>
      <IconButton 
        className="add-button"
        onClick={handleAdd}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={!tieneStock || loading}
        sx={{ 
          position: 'absolute', 
          bottom: 12, 
          right: 12, 
          zIndex: 50,
          bgcolor: tieneStock ? 'rgba(255, 255, 255, 0.4)' : 'rgba(200, 200, 200, 0.1)',
          backdropFilter: 'blur(8px)',
          color: tieneStock ? '#002855' : '#ccc',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          opacity: { xs: 1, md: 0 }, 
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
          '&:hover': { 
            bgcolor: tieneStock ? 'rgba(255, 255, 255, 0.7)' : 'rgba(200, 200, 200, 0.1)',
            transform: tieneStock ? 'scale(1.1)' : 'none',
          },
          '&.Mui-disabled': {
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            color: '#aaa'
          }
        }}
      >
        {loading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          <ShoppingBagOutlinedIcon sx={{ fontSize: '1.2rem' }} />
        )}
      </IconButton>
    </Tooltip>
  );
}