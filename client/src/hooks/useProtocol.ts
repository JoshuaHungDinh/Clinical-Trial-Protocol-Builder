import { useState, useEffect } from "react";
import { Protocol } from "../types/protocol";

interface UseProtocolResult {
  protocol: Protocol | null;
  loading: boolean;
  error: string | null;
}

export function useProtocol(id: string): UseProtocolResult {
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/protocols/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch protocol: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setProtocol(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { protocol, loading, error };
}
