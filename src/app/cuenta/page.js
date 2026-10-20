'use client';

import Link from 'next/link';
import { Button, Paper, Typography } from '@mui/material';
import { useAccount } from '../../components/cuenta/AccountBoundary';

export default function AccountPage() {
  const { user } = useAccount();
  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>Bienvenido a tu cuenta</Typography>
      <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere', mb: 3 }}>{user.email}</Typography>
      <Typography sx={{ mb: 3 }}>Consulta el estado de tus pedidos y descarga los comprobantes de tus compras confirmadas.</Typography>
      <Button component={Link} href="/cuenta/compras" variant="contained" sx={{ bgcolor: '#002855' }}>Ver mis compras</Button>
    </Paper>
  );
}
