'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Alert, Box, Button, CircularProgress, Container, Paper, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { supabase } from '../../../../lib/supabaseClient';
import { purchaseRequest, downloadReceipt, receiptLabel } from '../../../../lib/cuenta/client';
import { cartFingerprint } from '../../../../lib/cuenta/cart.mjs';
import { useCart } from '../../../components/context/CartContext';

function PaymentReturn() {
  const params = useSearchParams();
  const orderId = params.get('external_reference');
  const [result, setResult] = useState({ state: 'loading', order: null, token: null });
  const [downloadError, setDownloadError] = useState(null);
  const downloadController = useRef(null);
  useEffect(() => () => downloadController.current?.abort(), []);
  const { cart, clearCart } = useCart();
  useEffect(() => {
    const controller = new AbortController(); let timer;
    const started = Date.now();
    const finish = (value) => { if (!controller.signal.aborted) setResult(value); };
    const poll = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw new Error('No pudimos verificar tu sesión.');
        if (!session || !orderId) { finish({ state: 'guest', order: null, token: null }); return; }
        const response = await purchaseRequest(`/api/cuenta/compras/${encodeURIComponent(orderId)}`, session.access_token, { signal: controller.signal });
        const order = response.data;
        finish({ state: order.estado === 'exitoso' ? 'confirmed' : order.estado === 'pendiente' ? 'pending' : 'rejected', order, token: session.access_token });
        if (order.estado === 'pendiente' && Date.now() - started < 30_000) timer = setTimeout(poll, 2500);
      } catch (error) { if (!controller.signal.aborted) finish({ state: 'error', order: null, token: null, message: error.message }); }
    };
    poll();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
        controller.abort(); clearTimeout(timer); downloadController.current?.abort(); setResult({ state: 'guest', order: null, token: null });
      }
    });
    return () => { controller.abort(); clearTimeout(timer); subscription.unsubscribe(); };
  }, [orderId]);

  useEffect(() => {
    if (result.state !== 'confirmed') return;
    try {
      const pending = JSON.parse(sessionStorage.getItem('duoc:checkout-pending') ?? 'null');
      if (pending?.pedidoId === result.order.id && pending.cartKey === cartFingerprint(cart)) {
        sessionStorage.removeItem('duoc:checkout-pending');
        void clearCart();
      }
    } catch { /* No borrar la bolsa si no se puede comprobar su correspondencia. */ }
  }, [result, cart, clearCart]);

  const confirmed = result.state === 'confirmed';
  const title = confirmed ? 'Tu pago está confirmado' : result.state === 'rejected' ? 'Tu pago no está aprobado' : result.state === 'guest' ? 'Gracias por visitar nuestra tienda' : 'Verificando tu compra';
  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, borderRadius: 2, textAlign: 'center' }}>
      {result.state === 'loading' ? <CircularProgress aria-label="Verificando pago" /> : confirmed ? <CheckCircleOutlineIcon sx={{ fontSize: 64, color: 'success.main' }} /> : <HourglassEmptyIcon sx={{ fontSize: 54, color: '#002855' }} />}
      <Typography variant="h4" sx={{ fontFamily: 'serif', my: 2 }}>{title}</Typography>
      {result.order ? <Typography color="text.secondary" sx={{ mb: 3 }}>Pedido #{result.order.id}. {receiptLabel(result.order)}.</Typography>
        : <Typography color="text.secondary" sx={{ mb: 3 }}>La confirmación se realiza en el servidor. Cuando el pago sea aprobado, prepararemos el comprobante y lo enviaremos al correo de la compra. Si compraste con una cuenta, podrás revisarlo en Mis compras.</Typography>}
      {result.state === 'pending' && <Alert severity="info" sx={{ mb: 2 }}>El pago todavía está pendiente. Puedes consultar su estado más tarde en tu historial.</Alert>}
      {result.state === 'error' && <Alert severity="warning" sx={{ mb: 2 }}>{result.message}</Alert>}
      {downloadError && <Alert severity="error" sx={{ mb: 2 }}>{downloadError}</Alert>}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
        {confirmed && result.order.comprobante?.descargable && <Button variant="contained" sx={{ bgcolor: '#002855' }} onClick={async () => {
          try { downloadController.current?.abort(); downloadController.current = new AbortController(); await downloadReceipt(result.order.id, result.token, downloadController.current.signal); } catch (error) { setDownloadError(error.message); }
        }}>Descargar PDF</Button>}
        <Button component={Link} href="/cuenta/compras" variant="outlined">Mis compras</Button>
        <Button component={Link} href="/" variant="contained" sx={{ bgcolor: '#002855' }}>Volver a la tienda</Button>
      </Stack>
    </Paper>
  );
}

export default function PaymentReturnPage() {
  return <Box sx={{ bgcolor: '#fbfbfb', minHeight: '65vh', py: 6 }}><Container maxWidth="md"><Suspense fallback={<CircularProgress aria-label="Cargando confirmación" />}><PaymentReturn /></Suspense></Container></Box>;
}
