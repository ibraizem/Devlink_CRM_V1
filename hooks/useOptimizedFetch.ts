import { useState, useEffect, useCallback } from 'react';

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseOptimizedFetchResult<T> {
  data: T | null;
  error: Error | null;
  status: FetchStatus;
  refetch: () => Promise<void>;
}

export function useOptimizedFetch<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
): UseOptimizedFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<FetchStatus>('idle');

  const fetchData = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      setStatus('error');
    }
  }, [fetchFn]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...dependencies]);

  return {
    data,
    error,
    status,
    refetch: fetchData,
  };
}
