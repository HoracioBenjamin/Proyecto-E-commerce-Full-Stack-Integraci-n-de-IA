"use client";
import React, { useState } from 'react';
import { 
  Box, Container, Typography, TextField, Button, Paper, Link as MuiLink, Grid, Alert, CircularProgress 
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Para redirigir al usuario después del registro
import { supabase } from '../../../lib/supabaseClient';

export default function RegisterPage() {
  
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Nuevo estado para el botón

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validación básica de contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden. Inténtalo de nuevo.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      // 1. Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Insertar datos en la tabla 'perfiles'
      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('perfiles')
          .insert([
            {
              id: authData.user.id,             // Vinculado a auth.users.id
              nombres: formData.nombre,         // Mapeado a la columna 'nombres'
              apellidos: formData.apellido,     // Mapeado a la columna 'apellidos'
              rut: formData.rut,
              telefono: formData.telefono,
              email: formData.email
              // region_id y comuna_id no se envían para que queden como null (o su valor por defecto)
            }
          ]);

        if (profileError) throw profileError;

        // Registro exitoso: redirigir al login o a la página principal
        console.log("Registro y creación de perfil exitosos");
        router.push('/login?registered=true'); // Redirigimos al login
      }

    } catch (err) {
      console.error(err);
      // Personalizar el mensaje según el error de Supabase
      if (err.message.includes('User already registered')) {
        setError('Ya existe una cuenta con este correo electrónico.');
      } else {
        setError(err.message || 'Ocurrió un error inesperado al intentar registrarte.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#F2F4F7', 
      display: 'flex', 
      alignItems: 'flex-start', 
      justifyContent: 'center',
      pt: 4, 
      pb: 6
    }}>
      <Container maxWidth="sm" sx={{ mt: { xs: 2, md: 4 } }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 5 }, 
            border: '1px solid #ececec', 
            borderTop: '4px solid #FFB800',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Box
            component="img"
            src="/images/logo-duocuc-light.jpg"
            alt="Duoc UC"
            sx={{ height: 44, width: 'auto', mb: 2 }}
          />
          <Typography 
            variant="h5" 
            sx={{ 
              letterSpacing: '0.1em', 
              fontWeight: 700,
              color: '#002855',
              mb: 1
            }}
          >
            CREAR CUENTA
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
            Únete a WearShop para disfrutar de una experiencia de compra rápida y personalizada.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleRegister} sx={{ width: '100%' }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  id="nombre"
                  label="Nombre"
                  name="nombre"
                  variant="standard"
                  value={formData.nombre}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  id="apellido"
                  label="Apellido"
                  name="apellido"
                  variant="standard"
                  value={formData.apellido}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  id="rut"
                  label="RUT"
                  name="rut"
                  variant="standard"
                  placeholder="12.345.678-9"
                  value={formData.rut}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  id="telefono"
                  label="Teléfono"
                  name="telefono"
                  type="tel"
                  variant="standard"
                  placeholder="+56 9 1234 5678"
                  value={formData.telefono}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  variant="standard"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Contraseña"
                  type="password"
                  id="password"
                  variant="standard"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirmar Contraseña"
                  type="password"
                  id="confirmPassword"
                  variant="standard"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                mt: 5,
                bgcolor: '#002855',
                color: '#fff',
                py: 1.5,
                borderRadius: 0,
                letterSpacing: 2,
                fontWeight: 600,
                '&:hover': { bgcolor: '#001E42' },
                '&.Mui-disabled': { bgcolor: '#9AA8C3', color: '#fff' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'REGISTRARME'}
            </Button>
          </Box>

          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" passHref legacyBehavior>
                <MuiLink underline="always" sx={{ color: '#002855', fontWeight: 600 }}>
                  Inicia sesión aquí
                </MuiLink>
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}