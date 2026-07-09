"use client";
import React from 'react';
import { Paper, Typography, Stack, Box, Button, IconButton, Select, MenuItem, Divider } from '@mui/material';
import { DeleteOutline as DeleteIcon, ExpandMore as ExpandMoreIcon, Remove as RemoveIcon, Add as AddIcon } from '@mui/icons-material';

export default function OrderSummary({ cart, total, formatPrice, removeFromCart, updateQuantity, updateSize, setStep, router }) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: 4, border: '1px solid #ececec', borderRadius: '8px' }}>
      <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 700, letterSpacing: 1 }}>
        TU PEDIDO ({cart.length})
      </Typography>
      
      <Stack spacing={0}>
        {cart.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: 'gray', mb: 2, fontFamily: 'serif' }}>No hay productos en tu pedido.</Typography>
            <Button variant="outlined" color="inherit" onClick={() => router.push('/')} sx={{ borderRadius: 0, letterSpacing: '1px' }}>
              VOLVER A LA TIENDA
            </Button>
          </Box>
        ) : (
          cart.map((item, index) => (
            <Box key={`${item.id}-${item.size}`} sx={{ py: 3, borderBottom: index === cart.length - 1 ? 'none' : '1px solid #eee', position: 'relative' }}>
              <IconButton onClick={() => removeFromCart(item.id, item.size)} size="small" sx={{ position: 'absolute', top: 20, right: 0, color: '#ccc', '&:hover': { color: '#d32f2f', bgcolor: 'transparent' } }}>
                <DeleteIcon fontSize="small" />
              </IconButton>

              <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 } }}>
                <Box component="img" src={item.img} sx={{ width: { xs: 80, sm: 100 }, height: { xs: 100, sm: 125 }, objectFit: 'cover', borderRadius: '4px', bgcolor: '#f5f5f5' }} />
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 2, pr: 4 }}>
                      {item.name}
                    </Typography>

                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e0e0e0', pb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: 'gray', fontWeight: 600, textTransform: 'uppercase', mr: 1 }}>Talla:</Typography>
                        <Select value={item.size} onChange={(e) => updateSize(item.id, item.size, e.target.value)} variant="standard" disableUnderline IconComponent={ExpandMoreIcon} sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                          {item.stockCompleto?.map((s) => (
                            <MenuItem key={s.talla} value={s.talla} disabled={s.cantidad <= 0}>{s.talla}</MenuItem>
                          ))}
                        </Select>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #eee', borderRadius: '4px' }}>
                        <IconButton size="small" onClick={() => updateQuantity(item.id, item.size, -1)}><RemoveIcon sx={{ fontSize: '0.9rem' }} /></IconButton>
                        <Typography sx={{ px: 1, fontSize: '0.85rem', fontWeight: 700 }}>{item.quantity}</Typography>
                        <IconButton size="small" onClick={() => updateQuantity(item.id, item.size, 1)}><AddIcon sx={{ fontSize: '0.9rem' }} /></IconButton>
                      </Box>
                    </Stack>
                  </Box>

                  <Box sx={{ textAlign: 'right', mt: 1 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>{formatPrice(item.price_raw * item.quantity)}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          ))
        )}
      </Stack>

      {cart.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Subtotal</Typography>
              <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                {formatPrice(cart.reduce((acc, item) => acc + ((item.precio_normal || item.price_raw) * item.quantity), 0))}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Descuentos:</Typography>
              <Typography sx={{ color: '#d32f2f', fontWeight: 600, fontSize: '0.9rem' }}>
                {(() => {
                  const ahorroTotal = cart.reduce((acc, item) => item.en_oferta ? acc + ((item.precio_normal - item.price_raw) * item.quantity) : acc, 0);
                  return ahorroTotal > 0 ? `-${formatPrice(ahorroTotal)}` : formatPrice(0);
                })()}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total a pagar:</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#000' }}>{formatPrice(total)}</Typography>
          </Box>

          <Button fullWidth variant="contained" onClick={() => setStep(2)} sx={{ bgcolor: 'black', py: 2.5, borderRadius: 0, fontWeight: 700, letterSpacing: 2, '&:hover': { bgcolor: '#333' } }}>
            CONTINUAR CON EL ENVÍO
          </Button>
        </>
      )}
    </Paper>
  );
}