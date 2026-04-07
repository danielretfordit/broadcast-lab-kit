import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface ProjectInfo {
  guid: string | null;
  id: string;
  name: string;
  description: string;
}

export function useProjectInfo(): ProjectInfo {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const guid = searchParams.get('project') || searchParams.get('projectId') || null;
    const id = searchParams.get('projectNum') || '—';
    const name = searchParams.get('projectName') || 'Проект рассылок';
    const description = searchParams.get('projectDesc') || 'Проект планирования рассылок в мессенджеры и в email';
    return { guid, id, name, description };
  }, [searchParams]);
}
