"use client";
import React from 'react';
import { Paper, Typography, Box, Grid, TextField, Alert, Divider, FormControl, RadioGroup, FormControlLabel, Radio, MenuItem, Button } from '@mui/material';

//aca cargamos todas las variables o funciones que queremos pasar, como queremos pasar el precio de el envio por ejemplo
//la pasaremos aca, como vemos que agregue preciosEnvio tambien lo tengo que agregar mas abajo en el front end
export default function ShippingForm({ 
  user, loadingUser, formData, handleChange,
  regionesBD, comunasFiltradas, handleRegionChange, tipoEnvio, handleTipoEnvioChange, 
  totalFinal, formatPrice, setStep, preciosEnvio
}) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, border: '1px solid #ececec', borderRadius: '8px' }}>
      <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
        
        {/* DATOS PERSONALES */}
        <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 700, letterSpacing: 1 }}>1. DATOS PERSONALES</Typography>

        {loadingUser ? <Typography sx={{ mb: 3 }}>Comprobando sesión…</Typography> : (
          <Alert severity="info" sx={{ mb: 3 }}>
            {user ? 'Tu compra quedará registrada en esta cuenta. Revisa los datos para el envío y el comprobante.' : 'Compras como invitado. Recibirás el comprobante por correo; inicia sesión antes de pagar si quieres verlo en tu historial.'}
          </Alert>
        )}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid size={12}><TextField fullWidth label="Correo Electrónico" name="email" type="email" variant="standard" value={formData.email} onChange={handleChange} required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Nombre" name="nombre" variant="standard" value={formData.nombre} onChange={handleChange} required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Apellido" name="apellido" variant="standard" value={formData.apellido} onChange={handleChange} required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="RUT" name="rut" variant="standard" value={formData.rut} onChange={handleChange} required /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Teléfono" name="telefono" variant="standard" value={formData.telefono} onChange={handleChange} required /></Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* MÉTODO DE ENTREGA */}
        <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 700, letterSpacing: 1 }}>2. MÉTODO DE ENTREGA</Typography>
        
        <FormControl component="fieldset" sx={{ width: '100%', mb: 4 }}>
          <RadioGroup value={tipoEnvio} onChange={handleTipoEnvioChange}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              
              {/* Domicilio */}
              <Box sx={{ border: '1px solid', borderColor: tipoEnvio === 'domicilio' ? '#002855' : '#eee', p: 2, borderRadius: '4px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel value="domicilio" control={<Radio sx={{color: '#002855', '&.Mui-checked': {color: '#002855'}}} />} label={<Typography sx={{fontWeight: 600}}>Envío a Domicilio</Typography>} />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatPrice(preciosEnvio.domicilio)}</Typography> {/* ACA CANBIAMOS EL FORMAT PRICE {formatPrice(5990) POR {formatPrice(preciosEnvio.domicilio)}, ES LO MISMO MAS ABAJO CON EL PRESENCIAL }*/}
                </Box>
                {tipoEnvio === 'domicilio' && (
                  <Grid container spacing={3} sx={{ mt: 1, pl: { xs: 0, sm: 4 } }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField select fullWidth label="Región" name="region" value={formData.region} variant="standard" onChange={handleRegionChange} required={tipoEnvio === 'domicilio'}>
                        <MenuItem value="" disabled>Selecciona una región</MenuItem>
                        {regionesBD.map((region) => (<MenuItem key={region.id} value={region.id}>{region.nombre}</MenuItem>))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField select fullWidth label="Comuna" name="comuna" value={formData.comuna} variant="standard" onChange={handleChange} required={tipoEnvio === 'domicilio'} disabled={!formData.region}>
                        <MenuItem value="" disabled>{!formData.region ? "Primero selecciona una región" : "Selecciona tu comuna"}</MenuItem>
                        {comunasFiltradas.map((comuna) => (<MenuItem key={comuna.id} value={comuna.id}>{comuna.nombre}</MenuItem>))}
                      </TextField>
                    </Grid>
                    <Grid size={12}>
                      <TextField fullWidth label="Dirección (Calle y número)" name="direccion" value={formData.direccion} variant="standard" onChange={handleChange} required={tipoEnvio === 'domicilio'} />
                    </Grid>
                  </Grid>
                )}
              </Box>

              {/* RETIRO EN PUNTO  */}
              <Box sx={{ border: '1px solid', borderColor: tipoEnvio === 'presencial' ? '#002855' : '#eee', p: 2, borderRadius: '4px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel value="presencial" control={<Radio sx={{color: '#002855', '&.Mui-checked': {color: '#002855'}}} />} label={<Typography sx={{fontWeight: 600}}>Entrega Presencial (Estaciones de Metro)</Typography>} />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatPrice(preciosEnvio.presencial)}</Typography>
                </Box>
                {tipoEnvio === 'presencial' && (
                  <Grid container spacing={3} sx={{ mt: 1, pl: { xs: 0, sm: 4 } }}>
                    <Grid size={12}>
                      <TextField select fullWidth label="Selecciona una estación" name="estacionMetro" value={formData.estacionMetro} variant="standard" onChange={handleChange} required={tipoEnvio === 'presencial'}>
                        <MenuItem value="baquedano">Metro Baquedano</MenuItem>
                        <MenuItem value="tobalaba">Metro Tobalaba</MenuItem>
                        <MenuItem value="plaza_egana">Metro Plaza Egaña</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                )}
              </Box>

            </Box>
          </RadioGroup>
        </FormControl>

        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, bgcolor: '#002855', py: 2.5, borderRadius: 0, fontWeight: 700, letterSpacing: 2, '&:hover': { bgcolor: '#001E42' } }}>
          CONTINUAR AL PAGO ({formatPrice(totalFinal)})
        </Button>
      </form>
    </Paper>
  );
}