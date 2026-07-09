"use client";
import React from 'react';
import { Select, MenuItem, Drawer, Box, Typography, IconButton, List, Divider, Button, Stack } from '@mui/material';
import { 
  Close as CloseIcon, 
  Add as AddIcon, 
  Remove as RemoveIcon, 
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
          width: { xs: '100%', sm: '450px' }, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 0
        } 
      }}
    >
      {/* HEADER */}
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ letterSpacing: '2px', fontWeight: 600, fontFamily: 'serif' }}>
          MI BOLSA ({cart.length})
        </Typography>
        <IconButton onClick={() => toggleCart(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />

      {/* LISTA DE PRODUCTOS */}
      <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
        {cart.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 10, px: 3 }}>
            <Typography sx={{ color: 'gray', mb: 3, fontFamily: 'serif' }}>
              Tu bolsa está vacía.
            </Typography>
            <Button 
              variant="outlined" 
              color="inherit" 
              onClick={() => toggleCart(false)}
              sx={{ borderRadius: 0, letterSpacing: '1px' }}
            >
              CONTINUAR COMPRANDO
            </Button>
          </Box>
        ) : (
          cart.map((item) => (
            <Box key={`${item.id}-${item.size}`} sx={{ p: 3, borderBottom: '1px solid #eee' }}>
              <Box sx={{ display: 'flex', gap: 2, position: 'relative', minHeight: 130 }}>
                
                {/* Imagen del producto */}
                <Box 
                  component="img" 
                  src={item.img} 
                  sx={{ width: 100, height: 130, objectFit: 'cover', borderRadius: '2px', bgcolor: '#f5f5f5' }} 
                />
                
                {/* Info del producto (Contenedor principal de texto) */}
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Fila superior: Nombre y Botón Eliminar */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', pr: 3 }}>
                      {item.name}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => removeFromCart(item.id, item.size)}
                      sx={{ position: 'absolute', right: -8, top: -8 }}
                    >
                      <DeleteIcon fontSize="small" sx={{ color: '#ccc' }} />
                    </IconButton>
                  </Box>

                  {/* Selector de Talla con diseño moderno */}
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                    <Typography sx={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Talla
                    </Typography>
                    <Select
                      value={item.size}
                      onChange={(e) => updateSize(item.id, item.size, e.target.value)}
                      variant="standard"
                      disableUnderline
                      IconComponent={ExpandMoreIcon}
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        '& .MuiSelect-select': { py: 0, pl: 0.5, pr: '18px !important', display: 'flex', alignItems: 'center' },
                        '& .MuiSvgIcon-root': { fontSize: '1rem', color: '#000', right: -4 }
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
                              '&.Mui-selected': { bgcolor: '#000 !important', color: '#fff' }
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 'auto' }}>
                    
                    {/* Selector de Cantidad */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      border: '1px solid #e0e0e0', 
                      bgcolor: '#fff'
                    }}>
                      <IconButton size="small" onClick={() => updateQuantity(item.id, item.size, -1)} sx={{ p: 0.5 }}>
                        <RemoveIcon sx={{ fontSize: '0.8rem' }} />
                      </IconButton>
                      <Typography sx={{ px: 1.5, fontSize: '0.75rem', fontWeight: 700 }}>
                        {item.quantity}
                      </Typography>
                      <IconButton size="small" onClick={() => updateQuantity(item.id, item.size, 1)} sx={{ p: 0.5 }}>
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
  <Box sx={{ p: 3, borderTop: '1px solid #eee', bgcolor: 'white' }}>
    
    {/* DESGLOSE DE COSTOS */}
    <Stack spacing={1} sx={{ mb: 3 }}>
      {/* Subtotal (Suma de precios base) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography sx={{ color: 'gray', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Subtotal
        </Typography>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
          {formatPrice(cart.reduce((acc, item) => acc + ((item.precio_normal || item.price_raw) * item.quantity), 0))}
        </Typography>
      </Box>

      {/* Descuentos (Diferencia de ofertas) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography sx={{ color: 'gray', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
        <Typography sx={{ fontWeight: 700, color: 'black', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>
          Total Estimado
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: '1.3rem' }}>
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
          bgcolor: 'black', 
          color: 'white', 
          py: 2, 
          borderRadius: 0, 
          fontWeight: 700,
          letterSpacing: '2px',
          '&:hover': { bgcolor: '#333' } 
        }}
      >
        FINALIZAR COMPRA
      </Button>

      {/* Botón/Texto Continuar Comprando */}
      <Button 
        fullWidth 
        variant="text" 
        onClick={() => toggleCart(false)}
        sx={{ 
          color: 'gray', 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          letterSpacing: '1px',
          textTransform: 'uppercase',
          textDecoration: 'underline',
          '&:hover': { bgcolor: 'transparent', color: 'black' } 
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