import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMessage } from '@/contexts/MessageContext';
import PreviewPanel from '@/components/builder/PreviewPanel';
import { Loader2 } from 'lucide-react';
import { Platform } from '@/lib/message-builder';

interface ViewOnlyPageProps {
  lockedChannel?: Platform | null;
}

export default function ViewOnlyPage({ lockedChannel }: ViewOnlyPageProps) {
  const [searchParams] = useSearchParams();
  const { setMessage } = useMessage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const guid = searchParams.get('guid') || searchParams.get('project');

  useEffect(() => {
    if (!guid) {
      setError('Не указан GUID шаблона. Добавьте параметр ?mode=view&guid=...');
      setLoading(false);
      return;
    }

    fetch(`/api/getTemplate?guid=${guid}`)
    .then(res => res.json())
    .then(data => {
      setMessage(prev => ({ ...prev, ...data }));
      setLoading(false);
    })

    // TODO: replace with API call to load template by guid
    if (lockedChannel) {
      setMessage(prev => ({ ...prev, platform: lockedChannel }));
    }

    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [guid, lockedChannel, setMessage]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Загрузка шаблона...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <p className="text-xs text-muted-foreground">Проверьте URL и попробуйте снова</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <header className="flex items-center px-5 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-[10px] shadow-sm">
            CA
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Просмотр шаблона</h1>
            {guid && <p className="text-[10px] text-muted-foreground font-mono">{guid}</p>}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex justify-center">
        <div className="w-full max-w-2xl">
          <PreviewPanel viewOnly />
        </div>
      </div>
    </div>
  );
}
