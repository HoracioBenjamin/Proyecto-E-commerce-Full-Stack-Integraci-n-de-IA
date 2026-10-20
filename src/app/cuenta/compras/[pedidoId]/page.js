'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Divider, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { usePurchaseQuery } from '../../../../components/cuenta/usePurchaseQuery';
import { PaymentStatus, ReceiptActions } from '../../../../components/cuenta/PurchaseCards';
import { formatPurchaseDate, formatPurchaseMoney } from '../../../../../lib/cuenta/client';

export default function PurchaseDetailPage() {
  const { pedidoId } = useParams();
  const query = usePurchaseQuery(`/api/cuenta/compras/${encodeURIComponent(pedidoId)}`);
  const order = query.data?.data;
  return (
    <Stack spacing={2.5}>
      <Box><Button component={Link} href="/cuenta/compras">← Volver a mis compras</Button></Box>
      {query.loading ? <Box sx={{ py: 5, textAlign: 'center' }}><CircularProgress aria-label="Cargando pedido" /></Box>
        : query.error ? <Alert severity="error" action={<Button onClick={query.retry} color="inherit">Reintentar</Button>}>{query.error.message}</Alert>
          : order && (
            <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 2 }}>
              <Stack direction="row" useFlexGap flexWrap="wrap" justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
                <Box><Typography variant="h5">Pedido #{order.id}</Typography><Typography variant="body2" color="text.secondary">{formatPurchaseDate(order.created_at)}</Typography></Box>
                <PaymentStatus value={order.estado} />
              </Stack>
              {!order.snapshot_disponible && <Alert severity="info" sx={{ mb: 2 }}>Compra anterior sin detalle congelado. Los nombres corresponden al catálogo disponible; no se reconstruye un comprobante histórico automáticamente.</Alert>}
              <TableContainer><Table size="small" aria-label="Productos del pedido">
                <TableHead><TableRow><TableCell>Producto / variante</TableCell><TableCell align="right">Cantidad</TableCell><TableCell align="right">Precio</TableCell><TableCell align="right">Importe</TableCell></TableRow></TableHead>
                <TableBody>{order.lineas.map((line, index) => <TableRow key={index}>
                  <TableCell><Typography variant="body2" fontWeight={600}>{line.nombre}</Typography><Typography variant="caption" color="text.secondary">{line.color ? `${line.color} · ` : ''}Talla {line.talla}</Typography></TableCell>
                  <TableCell align="right">{line.cantidad}</TableCell><TableCell align="right">{formatPurchaseMoney(line.precio_unitario)}</TableCell><TableCell align="right">{formatPurchaseMoney(line.total_linea)}</TableCell>
                </TableRow>)}</TableBody>
              </Table></TableContainer>
              <Stack spacing={1} sx={{ ml: 'auto', mt: 3, maxWidth: 320 }}>
                {order.subtotal !== null && <TotalRow label="Subtotal" value={order.subtotal} />}
                {order.descuento > 0 && <TotalRow label="Descuento adicional" value={-order.descuento} />}
                {order.costo_envio !== null && <TotalRow label="Envío" value={order.costo_envio} />}
                <TotalRow label="Total del pedido" value={order.total} strong />
              </Stack>
              <Divider sx={{ my: 3 }} />
              <ReceiptActions order={order} detail />
              {order.comprobante?.estado_correo === 'aceptado' && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>El proveedor aceptó el correo con tu comprobante. Revisa también la carpeta de spam.</Typography>}
              <Box sx={{ mt: 2 }}><Button size="small" onClick={query.retry}>Actualizar estado del comprobante</Button></Box>
              <Typography variant="caption" color="text.secondary">Documento de demostración académica, sin validez tributaria.</Typography>
            </Paper>
          )}
    </Stack>
  );
}

function TotalRow({ label, value, strong = false }) {
  return <Stack direction="row" justifyContent="space-between" spacing={2}><Typography fontWeight={strong ? 700 : 400} variant="body2">{label}</Typography><Typography fontWeight={strong ? 700 : 400} variant="body2">{formatPurchaseMoney(value)}</Typography></Stack>;
}
