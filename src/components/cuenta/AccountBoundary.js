'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Container, Paper, Stack, Typography } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { supabase } from '../../../lib/supabaseClient';

const AccountContext = createContext(null);
export const useAccount = () => useContext(AccountContext);

export default function AccountBoundary({ children }) {
  const [auth, setAuth] = useState({ loading: true, session: null, error: false });
  const pathname = usePathname();
  useEffect(() => {
    let active = true; let changes = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      changes++;
      if (active) setAuth({ loading: false, session, error: false });
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (active && changes === 0) setAuth({ loading: false, session: data?.session ?? null, error: !!error });
    }).catch(() => { if (active && changes === 0) setAuth({ loading: false, session: null, error: true }); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  return (
    <Box sx={{ bgcolor: '#fbfbfb', minHeight: '65vh', py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <PersonOutlineIcon sx={{ color: '#002855', fontSize: 32 }} />
          <Box>
            <Typography variant="h4" sx={{ fontFamily: 'serif', color: '#002855' }}>Mi cuenta</Typography>
            <Typography variant="body2" color="text.secondary">Tus compras y comprobantes, en un solo lugar.</Typography>
          </Box>
        </Stack>
        {auth.loading ? <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress aria-label="Comprobando sesión" /></Box>
          : !auth.session ? (
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>Inicia sesión para ver tus compras</Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>El historial y los comprobantes están disponibles solo para el titular de la cuenta.</Typography>
              {auth.error && <Alert severity="warning" sx={{ mb: 2 }}>No pudimos comprobar tu sesión. Intenta iniciar sesión nuevamente.</Alert>}
              <Button component={Link} href="/login" variant="contained" sx={{ bgcolor: '#002855' }}>Iniciar sesión</Button>
            </Paper>
          ) : (
            <AccountContext.Provider value={{ user: auth.session.user, token: auth.session.access_token }}>
              <Box key={auth.session.user.id}>
                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                  <Button component={Link} href="/cuenta" variant={pathname === '/cuenta' ? 'contained' : 'outlined'} sx={{ ...(pathname === '/cuenta' && { bgcolor: '#002855' }) }}>Mi cuenta</Button>
                  <Button component={Link} href="/cuenta/compras" variant={pathname.startsWith('/cuenta/compras') ? 'contained' : 'outlined'} sx={{ ...(pathname.startsWith('/cuenta/compras') && { bgcolor: '#002855' }) }}>Mis compras</Button>
                </Stack>
                {children}
              </Box>
            </AccountContext.Provider>
          )}
      </Container>
    </Box>
  );
}
