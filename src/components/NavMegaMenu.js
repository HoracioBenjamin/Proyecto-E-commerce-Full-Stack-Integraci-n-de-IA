"use client";
import { Box, Typography } from '@mui/material';
import Link from 'next/link';

// Panel formato H&M: columna de links + tarjetas preview.
// Datos placeholder: el usuario los conectará después.
export default function NavMegaMenu({ link, groups, bottomLinks, previews }) {
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        gap: 6,
        bgcolor: '#fff',
        color: '#111',
        borderTop: '1px solid #eee',
        boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
        px: 5,
        py: 4,
        width: '100%',
        maxHeight: 'calc(100vh - 80px)',
        overflowY: 'auto',
      }}
    >
      {/* Columna de links */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, minWidth: 250, flexShrink: 0 }}>
        {groups.map((grupo, gi) => (
          <Box key={gi} sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, mb: grupo.gapAfter ? 2 : 0 }}>
            {grupo.items.map((texto) => (
              <Box
                key={texto}
                component={Link}
                href={link.href}
                sx={{
                  textDecoration: 'none',
                  color: '#111',
                  fontSize: '0.85rem',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {texto}
              </Box>
            ))}
          </Box>
        ))}

        {bottomLinks.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, mt: 2 }}>
            {bottomLinks.map((texto) => (
              <Box
                key={texto}
                component={Link}
                href={link.href}
                sx={{
                  textDecoration: 'none',
                  color: '#111',
                  fontSize: '0.85rem',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {texto}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Previews */}
      <Box sx={{ display: 'flex', gap: 3, flexShrink: 0 }}>
        {previews.map((prev) => (
          <Box key={prev.label} component={Link} href={link.href} sx={{ textDecoration: 'none', color: '#111' }}>
            <Box
              component="img"
              src={prev.img}
              alt={prev.label}
              sx={{ width: 180, height: 240, objectFit: 'cover', display: 'block', bgcolor: '#f2f2f2' }}
            />
            <Typography sx={{ mt: 1, fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {prev.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Relleno flexible para que el blanco cubra todo el ancho */}
      <Box sx={{ flex: 1 }} />
    </Box>
  );
}
