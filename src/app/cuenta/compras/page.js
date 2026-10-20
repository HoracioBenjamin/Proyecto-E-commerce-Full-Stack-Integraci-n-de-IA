'use client';

import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, Paper, Stack, Typography } from '@mui/material';
import { usePurchaseQuery } from '../../../components/cuenta/usePurchaseQuery';
import { PaymentStatus, ReceiptActions } from '../../../components/cuenta/PurchaseCards';
import { formatPurchaseDate, formatPurchaseMoney } from '../../../../lib/cuenta/client';

export default function PurchasesPage() {
  const [page, setPage] = useState(1);
  const query = usePurchaseQuery(`/api/cuenta/compras?page=${page}&pageSize=10`);
  return (
    <Stack spacing={2.5}>
      <Box><Typography variant="h5" gutterBottom>Historial de compras</Typography><Typography variant="body2" color="text.secondary">Pedidos de esta cuenta, del más reciente al más antiguo.</Typography></Box>
      {query.loading ? <Box sx={{ py: 5, textAlign: 'center' }}><CircularProgress aria-label="Cargando compras" /></Box>
        : query.error ? <Alert severity="error" action={<Button onClick={query.retry} color="inherit">Reintentar</Button>}>{query.error.message}</Alert>
          : !query.data?.data.length ? <Paper variant="outlined" sx={{ p: 4 }}><Typography>No hay compras en esta página.</Typography></Paper>
            : query.data.data.map((order) => (
              <Paper key={order.id} variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                  <Box><Typography fontWeight={700}>Pedido #{order.id}</Typography><Typography variant="body2" color="text.secondary">{formatPurchaseDate(order.created_at)}</Typography></Box>
                  <Stack direction="row" alignItems="center" spacing={2}><PaymentStatus value={order.estado} /><Typography fontWeight={700}>{formatPurchaseMoney(order.total)}</Typography></Stack>
                </Stack>
                {order.resumen && <Typography variant="body2" sx={{ mt: 2 }}>{order.resumen}</Typography>}
                <Divider sx={{ my: 2 }} />
                <ReceiptActions order={order} />
              </Paper>
            ))}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button onClick={() => setPage((value) => value - 1)} disabled={page === 1 || query.loading}>Anterior</Button>
        <Typography variant="body2">Página {page}{query.data ? ` · ${query.data.pagination.total} pedidos` : ''}</Typography>
        <Button onClick={() => setPage((value) => value + 1)} disabled={query.loading || !query.data || page * 10 >= query.data.pagination.total}>Siguiente</Button>
      </Stack>
    </Stack>
  );
}
