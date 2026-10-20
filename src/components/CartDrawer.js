"use client";
import React from 'react';
import { Select, MenuItem, Drawer, Box, Typography, IconButton, List, Divider, Button, Stack } from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingBagOutlined as ShoppingBagIcon,
  DeleteOutline as DeleteIcon
} from '@mui/icons-material';
import { useCart } from '../components/context/CartContext';
import { useRouter } from 'next/navigation';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    toggleCart,
    updateQuantity,
    removeFromCart,
    updateSize,
    total
  } = useCart();

  const router = useRouter();

  const handleCheckout = () => {
    toggleCart(false);
    router.push('/checkout');
  };

  // Formateador robusto para evitar el NaN y manejar moneda chilena
  const formatPrice = (value) => {
    const numero = Number(value);
    if (isNaN(numero)) return '$0';

    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(numero);
  };

  return (
    <Drawer
      anchor="right"
      open={isCartOpen}
      onClose={() => toggleCart(false)}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: '460px' },
          maxWidth: '100vw',
          color: '#002855',
          bgcolor: '#F2F4F7',
          fontFamily: 'inherit',
          '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root, & .MuiMenuItem-root': { fontFamily: 'inherit' },
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          boxShadow: '-12px 0 48px rgba(0,40,85,0.15)'
        }
      }}
    >
      {/* HEADER */}
      <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#002855', color: '#fff', borderBottom: '2px solid #FFB800', flexShrink: 0 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ShoppingBagIcon sx={{ color: '#FFB800', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.02em' }}>
              Mi bolsa
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>
              {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
            </Typography>
          </Box>
        </Stack>
        <IconButton aria-label="Cerrar bolsa de compras" onClick={() => toggleCart(false)} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.08)', '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* LISTA DE PRODUCTOS */}
      <List component="div" sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', p: { xs: 2, sm: 2.5 } }}>
        {cart.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 1 }}>
            <Box sx={{ width: 80, height: 80, mx: 'auto', mb: 3, borderRadius: '50%', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBagIcon sx={{ fontSize: 36, color: '#002855' }} />
            </Box>
            <Typography sx={{ color: '#002855', fontWeight: 600, fontSize: '1.1rem', mb: 3 }}>
              Tu bolsa está vacía.
            </Typography>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => toggleCart(false)}
              sx={{ borderRadius: 2, px: 3, py: 1.25, color: '#002855', borderColor: '#002855', fontWeight: 600, textTransform: 'none', '&:hover': { borderColor: '#002855', bgcolor: 'rgba(0,40,85,0.05)' } }}
            >
              Continuar comprando
            </Button>
          </Box>
        ) : (
          cart.map((item) => (
            <Box key={`${item.id}-${item.size}`} sx={{ p: 2, mb: 2, bgcolor: '#fff', border: '1px solid rgba(0,40,85,0.06)', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,40,85,0.03)' }}>
              <Box sx={{ display: 'flex', gap: 2, position: 'relative', minHeight: 140 }}>

                {/* Imagen del producto */}
                <Box
                  component="img"
                  src={item.img}
                  alt={item.name}
                  sx={{ width: { xs: 80, sm: 100 }, height: 120, flexShrink: 0, objectFit: 'cover', borderRadius: 1.5, bgcolor: '#F2F4F7' }}
                />

                {/* Info del producto (Contenedor principal de texto) */}
                <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

                  {/* Fila superior: Nombre y Botón Eliminar */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.4, color: '#002855', pr: 3, overflowWrap: 'anywhere' }}>
                      {item.name}
                    </Typography>
                    <IconButton
                      size="small"
                      aria-label={`Eliminar ${item.name}`}
                      onClick={() => removeFromCart(item.id, item.size)}
                      sx={{ position: 'absolute', right: -8, top: -8, color: '#667085', '&:hover': { color: '#d32f2f', bgcolor: '#fff1f0' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Selector de Talla con diseño moderno */}
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#667085' }}>
                      Talla
                    </Typography>
                    <Select
                      value={item.size}
                      inputProps={{ 'aria-label': `Talla de ${item.name}` }}
                      onChange={(e) => updateSize(item.id, item.size, e.target.value)}
                      variant="standard"
                      disableUnderline
                      IconComponent={ExpandMoreIcon}
                      sx={{
                        fontSize: '0.85rem',
                        color: '#002855',
                        bgcolor: '#F2F4F7',
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                        fontWeight: 600,
                        '& .MuiSelect-select': { py: 0, pl: 0.5, pr: '18px !important', display: 'flex', alignItems: 'center' },
                        '& .MuiSvgIcon-root': { fontSize: '1rem', color: '#002855', right: -4 }
                      }}
                      MenuProps={{
                        PaperProps: {
                          elevation: 0,
                          sx: {
                            borderRadius: 0,
                            border: '1px solid #eee',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                            '& .MuiMenuItem-root': {
                              fontSize: '0.8rem',
                              py: 1,
                              justifyContent: 'center',
                              '&.Mui-selected': { bgcolor: '#002855 !important', color: '#fff' }
                            }
                          }
                        }
                      }}
                    >
                      {item.stockCompleto?.map((s) => (
                        <MenuItem key={s.talla} value={s.talla} disabled={s.cantidad <= 0}>
                          {s.talla} {s.cantidad <= 0 && '(Agotado)'}
                        </MenuItem>
                      ))}
                    </Select>
                  </Stack>

                  {/* Fila Inferior (Posicionada abajo con mt: 'auto') */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, pt: 2, mt: 'auto' }}>

                    {/* Selector de Cantidad */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid #dce2ea',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      bgcolor: '#fff'
                    }}>
                      <IconButton aria-label={`Reducir cantidad de ${item.name}`} size="small" onClick={() => updateQuantity(item.id, item.size, -1)} sx={{ p: 1, color: '#002855' }}>
                        <RemoveIcon sx={{ fontSize: '0.8rem' }} />
                      </IconButton>
                      <Typography sx={{ px: 1, fontSize: '0.85rem', fontWeight: 700 }}>
                        {item.quantity}
                      </Typography>
                      <IconButton aria-label={`Aumentar cantidad de ${item.name}`} size="small" onClick={() => updateQuantity(item.id, item.size, 1)} sx={{ p: 1, color: '#002855' }}>
                        <AddIcon sx={{ fontSize: '0.8rem' }} />
                      </IconButton>
                    </Box>

                    {/* Lógica de Precios: Normal vs Oferta */}
                    <Box sx={{ textAlign: 'right' }}>
                      {item.en_oferta ? (
                        <Stack spacing={0} alignItems="flex-end">
                          <Typography sx={{
                            fontSize: '0.7rem',
                            color: 'gray',
                            textDecoration: 'line-through'
                          }}>
                            {formatPrice(item.precio_normal * item.quantity)}
                          </Typography>
                          <Typography sx={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: '#d32f2f'
                          }}>
                            {formatPrice(item.price_raw * item.quantity)}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                          {formatPrice(item.price_raw * item.quantity)}
                        </Typography>
                      )}
                    </Box>

                  </Box>
                </Box>
              </Box>
            </Box>
          ))
        )}
      </List>

      {/* FOOTER */}
      {cart.length > 0 && (
        <Box sx={{ p: { xs: 2.5, sm: 3 }, pb: 'max(20px, env(safe-area-inset-bottom))', flexShrink: 0, borderTop: '1px solid #dce2ea', bgcolor: '#fff', boxShadow: '0 -4px 20px rgba(0,40,85,0.04)' }}>

          {/* DESGLOSE DE COSTOS */}
          <Stack spacing={1} sx={{ mb: 3 }}>
            {/* Subtotal (Suma de precios base) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: '#667085', fontSize: '0.85rem' }}>
                Subtotal
              </Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {formatPrice(cart.reduce((acc, item) => acc + ((item.precio_normal || item.price_raw) * item.quantity), 0))}
              </Typography>
            </Box>

            {/* Descuentos (Diferencia de ofertas) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: '#667085', fontSize: '0.85rem' }}>
                Descuentos
              </Typography>
              <Typography sx={{ color: '#d32f2f', fontWeight: 600, fontSize: '0.9rem' }}>
                {(() => {
                  const ahorro = cart.reduce((acc, item) => {
                    if (item.en_oferta) {
                      return acc + ((item.precio_normal - item.price_raw) * item.quantity);
                    }
                    return acc;
                  }, 0);
                  return ahorro > 0 ? `-${formatPrice(ahorro)}` : formatPrice(0);
                })()}
              </Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Total Final */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 600, color: '#002855', fontSize: '0.95rem' }}>
                Total estimado
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.4rem', color: '#002855' }}>
                {formatPrice(total)}
              </Typography>
            </Box>
          </Stack>

          {/* BOTONES DE ACCIÓN */}
          <Stack spacing={2}>
            {/* Botón Finalizar */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleCheckout}
              sx={{
                bgcolor: '#002855',
                color: 'white',
                py: 1.75,
                borderRadius: 2,
                boxShadow: 'none',
                borderBottom: '3px solid #FFB800',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                '&:hover': { bgcolor: '#001E42' }
              }}
            >
              Finalizar compra
            </Button>

            {/* Botón/Texto Continuar Comprando */}
            <Button
              fullWidth
              variant="text"
              onClick={() => toggleCart(false)}
              sx={{
                color: '#002855',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { bgcolor: 'transparent', color: '#002855' }
              }}
            >
              Continuar comprando
            </Button>
          </Stack>
        </Box>
      )}
    </Drawer>
  );
}
