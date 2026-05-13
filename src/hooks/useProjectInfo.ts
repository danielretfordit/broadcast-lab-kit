import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface ProjectInfo {
  guid: string | null;
  id: string;
  name: string;
  description: string;
}

export function useProjectInfo(): ProjectInfo {
  const [searchParams] = useSearchParams();
  const [httpData, setHttpData] = useState<any>(null);

  const guid = searchParams.get('guid');

  const getHttpJson = async () => {
    if (!guid || guid === 'null') return;
    try {
      const response = await fetch(`/api/getTemplate?guid=${guid}`);
      if (!response.ok) return;
      const text = await response.text();
      if (!text) return;
      const data = JSON.parse(text);
      setHttpData(data);
    } catch (error) {
      console.warn('getTemplate failed:', error);
    }
  };

  useEffect(() => {
    getHttpJson().catch(() => {});
  }, []);

  return useMemo(() => {
    return {
      guid: guid || null,
      id: httpData?.objectId || '—',
      name: httpData?.topic || '—',
      description: httpData?.description || '—',
    };
  }, [httpData]);
}
