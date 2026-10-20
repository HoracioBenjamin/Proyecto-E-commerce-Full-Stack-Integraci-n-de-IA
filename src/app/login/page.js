"use client";
import React, { useState } from 'react';
import { 
  Box, Container, Typography, TextField, Button, Paper, Link as MuiLink, Alert, CircularProgress
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { supabase } from '../../../lib/supabaseClient'; // Asegúrate de que la ruta sea correcta

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Estados para manejar errores y la animación de carga
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log("Intentando iniciar sesión con:", formData.email);
      
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) throw loginError;

      if (data?.session) {
        console.log("¡Inicio de sesión exitoso!");
        // Redirigir al inicio o al panel del usuario una vez logueado
        router.push('/'); 
        // Opcional: router.refresh() si necesitas que el navbar detecte la sesión inmediatamente
      }

    } catch (err) {
      console.error("Error capturado:", err);
      // Personalizamos el error de credenciales inválidas para que esté en español
      if (err.message.includes('Invalid login credentials')) {
        setError('Correo electrónico o contraseña incorrectos.');
      } else {
        setError(err.message || 'Ocurrió un error inesperado al intentar iniciar sesión.');
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
      pt: 1, 
      pb: 4
    }}>
      <Container maxWidth="xs" sx={{ mt: { xs: 0, md: 1 } }}>
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
          {/* Título */}
          <Typography 
            variant="h5" 
            sx={{ 
              letterSpacing: '0.1em', 
              fontWeight: 700,
              color: '#002855',
              mb: 1
            }}
          >
            INICIAR SESIÓN
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
            Ingresa a tu cuenta de WearShop para gestionar tus pedidos y guardar tus favoritos.
          </Typography>

          {/* Alerta de Error */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Formulario */}
          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              variant="standard"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              variant="standard"
              value={formData.password}
              onChange={handleChange}
              sx={{ mb: 4 }}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'INGRESAR'}
            </Button>
          </Box>

          {/* Enlaces adicionales */}
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <MuiLink href="#" variant="body2" underline="hover" color="text.secondary">
              ¿Olvidaste tu contraseña?
            </MuiLink>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              ¿No tienes una cuenta?{' '}
              {/* Enlace corregido sin legacyBehavior */}
              <MuiLink component={Link} href="/registro" underline="always" sx={{ color: '#002855', fontWeight: 600 }}>
                Regístrate aquí
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}