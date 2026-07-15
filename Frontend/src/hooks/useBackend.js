import { useCallback, useEffect, useState } from 'react';

export function useBackend(initialUrl = 'http://localhost:8000') {
  const [backendUrl, setBackendUrl] = useState(initialUrl);
  const [backendState, setBackendState] = useState({ status: 'checking', label: 'checking backend…' });

  const backendBase = useCallback(() => backendUrl.trim().replace(/\/+$/, ''), [backendUrl]);

  const checkBackend = useCallback(async () => {
    try {
      const res = await fetch(backendBase() + '/health');
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      setBackendState({ status: 'connected', label: 'connected · ' + (data.model || 'model loaded') });
      return true;
    } catch (err) {
      setBackendState({ status: 'error', label: 'not reachable — start server.py' });
      return false;
    }
  }, [backendBase]);

  useEffect(() => {
    checkBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { backendUrl, setBackendUrl, backendState, backendBase, checkBackend };
}
