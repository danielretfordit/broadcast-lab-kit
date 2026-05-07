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
    try {
      const response = await fetch(`/api/getTemplate?guid=${guid}`);
      const data = await response.json();
      setHttpData(data);
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

  useEffect(() => {
    getHttpJson();
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
