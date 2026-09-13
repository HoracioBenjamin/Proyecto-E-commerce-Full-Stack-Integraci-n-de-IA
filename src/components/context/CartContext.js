"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient'; 

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  
  // NUEVO: Candado para evitar que el LocalStorage se borre por accidente
  const [isInitialized, setIsInitialized] = useState(false); 

  // ==========================================
  // FUNCIÓN PARA FUSIONAR CARritos
  // ==========================================
  const mergeCarts = async (userId, localCart) => {
    if (!localCart || localCart.length === 0) return;

    for (const item of localCart) {
      const { data: existing } = await supabase
        .from('items_carrito')
        .select('*')
        .eq('perfil_id', userId)
        .eq('producto_id', item.id)
        .eq('talla', item.size)
        .single();

      if (!existing) {
        await supabase.from('items_carrito').insert({
          perfil_id: userId,
          producto_id: item.id,
          talla: item.size,
          cantidad: item.quantity
        });
      }
      // Si ya existe, por ahora mantenemos el de la DB por seguridad.
    }
    
    // Limpiamos el localStorage después de fusionar exitosamente
    localStorage.removeItem('cart_l_ancora');
  };

  // ==========================================
  // INICIALIZACIÓN ÚNICA DEL CARRITO
  // ==========================================
  useEffect(() => {
    const initializeCart = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      // Leemos lo que hay guardado de forma local
      const localCart = JSON.parse(localStorage.getItem('cart_l_ancora') || '[]');

      if (currentUser) {
        // 1. Fusionamos antes de cargar
        await mergeCarts(currentUser.id, localCart);

        // 2. Cargamos todo desde la DB
        const { data: dbCart, error } = await supabase
          .from('items_carrito')
          .select(`
            talla, cantidad, producto_id,
            productos (id, nombre, imagen_url, precio, precio_oferta, en_oferta, stock (talla, cantidad))
          `)
          .eq('perfil_id', currentUser.id);

        if (!error && dbCart) {
          const formattedCart = dbCart.map(item => {
            const prod = item.productos;
            const infoStock = prod.stock?.find(s => s.talla === item.talla);
            return {
              id: item.producto_id,
              name: prod.nombre,
              img: prod.imagen_url,
              size: item.talla,
              quantity: item.cantidad,
              price_raw: prod.en_oferta ? prod.precio_oferta : prod.precio,
              precio_normal: prod.precio,
              en_oferta: prod.en_oferta,
              stockMaximo: infoStock ? infoStock.cantidad : 0,
              stockCompleto: prod.stock
            };
          });
          setCart(formattedCart);
        }
      } else {
        // Si no hay usuario logueado, cargamos el de invitado
        setCart(localCart);
      }
      
      // Abrimos el candado: la carga inicial ha terminado
      setIsInitialized(true); 
    };

    initializeCart();
  }, []);

  // ==========================================
  // GUARDADO SEGURO EN LOCALSTORAGE
  // ==========================================
  useEffect(() => {
    // SOLO guardamos si ya terminamos de inicializar y NO hay usuario
    if (isInitialized && !user) {
      localStorage.setItem('cart_l_ancora', JSON.stringify(cart));
    }
  }, [cart, user, isInitialized]);


  // ==========================================
  // FUNCIONES DEL CARRITO (Actualización Optimista)
  // ==========================================
  const addToCart = async (product, openDrawer = true) => {
    const isAlreadyInCart = cart.some(
      (item) => item.id === product.id && item.size === (product.size || 'M')
    );

    if (isAlreadyInCart) {
      setToast({ visible: true, message: 'Producto ya está en tu bolsa' });
      return;
    }

    const precioEntrante = product.price_raw || product.price || product.precio || 0;
    const size = product.size || 'M';

    setCart((prev) => [...prev, { 
      ...product, 
      quantity: 1, 
      size: size,
      price_raw: Number(precioEntrante) 
    }]);
    
    if (openDrawer) setIsCartOpen(true);

    if (user) {
      await supabase.from('items_carrito').insert({
        perfil_id: user.id,
        producto_id: product.id,
        talla: size,
        cantidad: 1
      });
    }
  };

  const updateQuantity = async (id, size, delta) => {
    let nuevaCantidadCalculada = 0;

    setCart((prev) => prev.map(item => {
      if (item.id === id && item.size === size) {
        const nuevaCantidad = item.quantity + delta;

        if (nuevaCantidad > item.stockMaximo) {
          setToast({ visible: true, message: `Lo sentimos, solo quedan ${item.stockMaximo} unidades.` });
          nuevaCantidadCalculada = item.quantity; 
          return item; 
        }

        nuevaCantidadCalculada = Math.max(1, nuevaCantidad);
        return { ...item, quantity: nuevaCantidadCalculada };
      }
      return item;
    }));

    if (user && nuevaCantidadCalculada > 0) {
      await supabase
        .from('items_carrito')
        .update({ cantidad: nuevaCantidadCalculada })
        .match({ perfil_id: user.id, producto_id: id, talla: size });
    }
  };

  const updateSize = async (id, oldSize, newSize) => {
    const alreadyHasNewSize = cart.some(item => item.id === id && item.size === newSize);
    
    if (alreadyHasNewSize) {
      setToast({ visible: true, message: 'Esta talla ya está en tu bolsa' });
      return; 
    }

    let cantidadFinal = 1;

    setCart((prev) => prev.map(item => {
      if (item.id === id && item.size === oldSize) {
        const nuevoStockInfo = item.stockCompleto?.find(s => s.talla === newSize);
        const nuevoMax = nuevoStockInfo ? nuevoStockInfo.cantidad : item.stockMaximo;
        cantidadFinal = item.quantity > nuevoMax ? nuevoMax : item.quantity;

        return { 
          ...item, size: newSize, stockMaximo: nuevoMax, quantity: cantidadFinal 
        };
      }
      return item;
    }));

    if (user) {
      await supabase
        .from('items_carrito')
        .update({ talla: newSize, cantidad: cantidadFinal })
        .match({ perfil_id: user.id, producto_id: id, talla: oldSize });
    }
  };

  const removeFromCart = async (id, size) => {
    setCart((prev) => prev.filter(item => !(item.id === id && item.size === size)));

    if (user) {
      await supabase
        .from('items_carrito')
        .delete()
        .match({ perfil_id: user.id, producto_id: id, talla: size });
    }
  };

  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem('cart_l_ancora');
    
    if (user) {
      await supabase
        .from('items_carrito')
        .delete()
        .eq('perfil_id', user.id);
    }
  };

  const toggleCart = (val) => setIsCartOpen(val);
  const closeToast = () => setToast({ visible: false, message: '' });

  const total = cart.reduce((acc, item) => {
    return acc + (item.price_raw * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, updateQuantity, removeFromCart, updateSize, clearCart, 
      isCartOpen, toggleCart, total, toast, closeToast 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de un CartProvider");
  return context;
}