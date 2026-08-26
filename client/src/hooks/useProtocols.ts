import { useState, useEffect } from "react";
import { ProtocolSummary, ProtocolStatus } from "../types/protocol";

interface UseProtocolsParams {
  search?: string;
  status?: ProtocolStatus;
}

interface UseProtocolsResult {
  protocols: ProtocolSummary[];
  loading: boolean;
  error: string | null;
}

export function useProtocols(params?: UseProtocolsParams): UseProtocolsResult {
  const [protocols, setProtocols] = useState<ProtocolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);

    const queryString = query.toString();
    const url = `/api/protocols${queryString ? `?${queryString}` : ""}`;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch protocols: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setProtocols(data);
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
  }, [params?.search, params?.status]);

  return { protocols, loading, error };
}
