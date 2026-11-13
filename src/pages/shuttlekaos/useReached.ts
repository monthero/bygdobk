import { useEffect, useState } from 'react';

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

export const useReached = (iso: string | null | undefined) => {
  const at = iso ? Date.parse(iso) : null;
  const [now, setNow] = useState(Date.now);
  const reached = at !== null && now >= at;

  useEffect(() => {
    if (at === null || reached) return undefined;
    const timer = setTimeout(() => setNow(Date.now()), Math.min(at - Date.now(), MAX_TIMEOUT_MS));
    return () => clearTimeout(timer);
  }, [at, reached]);

  return reached;
};
