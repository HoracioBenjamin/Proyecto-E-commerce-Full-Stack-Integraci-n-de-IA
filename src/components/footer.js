"use client";
import { Box, Grid, Typography, Container, Divider, Stack } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock'; // Asegúrate de tener @mui/icons-material instalado

const footerLinks = [
  { title: 'SERVICIO AL CLIENTE', links: ['Contacto', 'FAQs', 'Envíos', 'Devoluciones'] },
  { title: 'LA EMPRESA', links: ['Sobre la empresa', 'Ubicacion', 'Programacion con etica'] },
  { title: 'LEGAL', links: ['Privacidad', 'Cookies', 'Términos y Condiciones'] },
];

export default function MinimalFooter() {
  return (
    <Box component="footer" sx={{ bgcolor: '#002855', color: '#fff', pt: 5, pb: 5, borderTop: '2px solid #FFB800' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {footerLinks.map((section) => (
            <Grid size={{ xs: 12, sm: 4 }} key={section.title}>
              <Typography 
                variant="subtitle2" 
                sx={{ letterSpacing: '0.2em', fontWeight: 700, mb: 3, fontSize: '0.7rem', color: '#FFB800' }}
              >
                {section.title}
              </Typography>
              <Stack spacing={1}>
                {section.links.map((link) => (
                  <Typography 
                    key={link} 
                    variant="caption" 
                    sx={{ 
                      cursor: 'pointer', 
                      color: 'rgba(255,255,255,0.75)', 
                      '&:hover': { color: '#FFB800' },
                      transition: 'color 0.3s'
                    }}
                  >
                    {link}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        {/* --- SECCIÓN DE PAGOS (NUEVA) --- */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', mb: 2, display: 'block' }}>
            MEDIOS DE PAGO SEGUROS
          </Typography>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={3} 
            justifyContent="center" 
            alignItems="center"
          >
            {/* Logo de Webpay Plus */}
            <Box 
              component="img"
              src="/images/webpay-plus.png"
              alt="Webpay Plus"
              sx={{ height: 35, filter: 'grayscale(0.5)', '&:hover': { filter: 'grayscale(0)' }, transition: '0.3s' }}
            />
            
            {/* Indicador de Pago Seguro */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ color: '#2e7d32' }}>
              <LockIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                TRANSACCIÓN PROTEGIDA POR TRANSBANK
              </Typography>
            </Stack>

            <Box 
              component="img"
              src="/images/images.png"
              alt="Webpay Plus"
              sx={{ height: 35, filter: 'grayscale(0.5)', '&:hover': { filter: 'grayscale(0)' }, transition: '0.3s' }}
            />
          </Stack>
        </Box>
        {/* ------------------------------- */}

        <Divider sx={{ mb: 5, opacity: 0.5, borderColor: 'rgba(255,255,255,0.2)' }} />

        <Box sx={{ textAlign: 'center' }}>
          <Box
            component="img"
            src="/images/logo-shoesduoc.svg"
            alt="ShoesDuoc — WearShop"
            sx={{ height: 40, width: 'auto', mx: 'auto', mb: 2 }}
          />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
            © 2026 WearShop — ShoesDuoc | Duoc UC Sede Puente Alto
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}