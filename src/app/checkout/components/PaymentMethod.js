"use client";
import React from 'react';
// ¡Importante! Agregamos 'Collapse' a las importaciones de Material-UI
import { Paper, Typography, FormControl, RadioGroup, Box, FormControlLabel, Radio, Stack, Divider, Button, Collapse } from '@mui/material';

export default function PaymentMethod({ 
  metodoPago, setMetodoPago, total, costoEnvio, tipoEnvio, 
  totalFinal, formatPrice, handleSubmitFinal 
}) {

  // Definimos los estilos del botón dinámicamente según la plataforma seleccionada
  const esMercadoPago = metodoPago === 'mercadopago';
  
  const buttonStyles = {
    bgcolor: esMercadoPago ? '#009EE3' : '#002855',
    color: 'white',
    py: 2.5,
    borderRadius: esMercadoPago ? '6px' : 0, 
    fontWeight: 700,
    letterSpacing: esMercadoPago ? '0.5px' : '2px',
    textTransform: esMercadoPago ? 'none' : 'uppercase', 
    fontSize: esMercadoPago ? '16px' : '14px',
    transition: 'all 0.2s ease',
    '&:hover': { 
      bgcolor: esMercadoPago ? '#0081ba' : '#001E42' 
    }
  };

  return (

    <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, border: '1px solid #ececec', borderRadius: '8px' }}>
      <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 700, letterSpacing: 1 }}>
        3. SELECCIONA TU MÉTODO DE PAGO
      </Typography>

      <FormControl component="fieldset" sx={{ width: '100%', mb: 4 }}>
        <RadioGroup value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
          <Stack spacing={2}>
                        {/* Opción: Mercado Pago */}
            <Box
              sx={{
                border: '1px solid',
                borderColor: metodoPago === 'mercadopago' ? '#009EE3' : '#eee',
                p: 2,
                borderRadius: '4px',
                cursor: 'pointer',
                bgcolor: metodoPago === 'mercadopago' ? '#f5fafd' : 'transparent',
                transition: 'all 0.3s ease', // Transición suave para el fondo del contenedor
              }}
            >
              <FormControlLabel
                value="mercadopago"
                control={<Radio sx={{color: esMercadoPago ? '#009EE3' : '#002855', '&.Mui-checked': {color: '#009EE3'}}} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{fontWeight: 600, color: esMercadoPago ? '#009EE3' : 'inherit'}}>Mercado Pago</Typography>
                    <Typography variant="caption" color="text.secondary">(Dinero en cuenta, Redcompra, cuotas)</Typography>
                  </Box>
                }
              />
              
              {/* Animación Collapse: Solo muestra el contenido si esMercadoPago es true */}
              <Collapse in={esMercadoPago} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 1, textAlign: 'left', pl: { xs: 0, sm: 4 } }}>
                  <img
                    src="/images/Mercado_Pago_Tarjetas.png" /* Cambia .png por tu extensión real si es distinta */
                    alt="Métodos de pago compatibles con Mercado Pago"
                    style={{ height: 'auto', maxWidth: '100%', width: '180px' }}
                  />
                </Box>
              </Collapse>
            </Box>
            
            {/* Opción: Webpay */}
            <Box sx={{ border: '1px solid', borderColor: metodoPago === 'webpay' ? '#002855' : '#eee', p: 2, borderRadius: '4px', cursor: 'pointer' }}>
              <FormControlLabel 
                value="webpay" control={<Radio sx={{color: '#002855', '&.Mui-checked': {color: '#002855'}}} />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{fontWeight: 600}}>Webpay Plus (Transbank)</Typography>
                    <Typography variant="caption" color="text.secondary">(Tarjetas de Débito / Crédito)</Typography>
                  </Box>
                } 
              />
            </Box>
            
          </Stack>
        </RadioGroup>
      </FormControl>

      {/* Desglose de cobros */}
      <Paper variant="outlined" sx={{ p: 2, mb: 4, bgcolor: '#fafafa', border: '1px solid #eee' }}>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Productos:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatPrice(total)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Envío ({tipoEnvio === 'domicilio' ? 'A Domicilio' : 'Presencial'}):
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatPrice(costoEnvio)}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 700 }}>Total Final a Pagar:</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatPrice(totalFinal)}</Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Botón de Acción Dinámico */}
      <Button 
        fullWidth 
        variant="contained" 
        onClick={handleSubmitFinal} 
        sx={buttonStyles}
        startIcon={esMercadoPago ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'transparent',
              borderRadius: '4px',
              p: 0.5,
              mr: -1,
              width: '60 px',
              height: '40px',
            }}
          >
            <img 
              src="/images/boton_mercadopago.png" /* Cambia .png por tu extensión real si es distinta */
              alt="Logo de Mercado Pago" 
              style={{ width: 'auto', height: '100%' }}
            />
          </Box>
        ) : null}
      >
        {esMercadoPago ? 'Pagar con Mercado Pago' : 'PROXIMAMENTE'}
      </Button>
    </Paper>
  );
}