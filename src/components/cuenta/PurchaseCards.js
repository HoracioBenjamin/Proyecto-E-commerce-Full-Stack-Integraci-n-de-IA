'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, Stack } from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { useAccount } from './AccountBoundary';
import { downloadReceipt, receiptLabel } from '../../../lib/cuenta/client';

export function PaymentStatus({ value }) {
  const label = { exitoso: 'Pago confirmado', pendiente: 'Pago pendiente', erroneo: 'Pago no aprobado / revertido' }[value] ?? value;
  return <Chip size="small" label={label} color={value === 'exitoso' ? 'success' : value === 'pendiente' ? 'warning' : 'default'} variant="outlined" />;
}

export function ReceiptActions({ order, detail = false }) {
  const { token } = useAccount();
  const controller = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => () => controller.current?.abort(), []);
  const download = async () => {
    controller.current?.abort(); controller.current = new AbortController();
    const signal = controller.current.signal;
    setBusy(true); setError(null);
    try { await downloadReceipt(order.id, token, signal); }
    catch (issue) { if (!signal.aborted) setError(issue.message); }
    finally { if (!signal.aborted) setBusy(false); }
  };
  return (
    <Box>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
        {!detail && <Button component={Link} href={`/cuenta/compras/${order.id}`} size="small" variant="outlined">Ver detalle</Button>}
        {order.estado === 'exitoso' && order.comprobante?.descargable && (
          <Button onClick={download} disabled={busy} startIcon={<DownloadOutlinedIcon />} size="small" variant="contained" sx={{ bgcolor: '#002855' }}>
            {busy ? 'Descargando…' : 'Descargar PDF'}
          </Button>
        )}
        <Box component="span" sx={{ color: 'text.secondary', fontSize: 12 }}>{receiptLabel(order)}</Box>
      </Stack>
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
    </Box>
  );
}
