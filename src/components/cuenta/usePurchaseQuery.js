'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from './AccountBoundary';
import { purchaseRequest } from '../../../lib/cuenta/client';

export function usePurchaseQuery(path) {
  const { token } = useAccount();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    purchaseRequest(path, token, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setResult({ path, token, revision, data, error: null }); })
      .catch((error) => { if (!controller.signal.aborted) setResult({ path, token, revision, data: null, error }); });
    return () => controller.abort();
  }, [path, token, revision]);
  const ready = result?.path === path && result?.token === token && result?.revision === revision;
  const retry = useCallback(() => setRevision((value) => value + 1), []);
  return { loading: !ready, data: ready ? result.data : null, error: ready ? result.error : null, retry };
}
