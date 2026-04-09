import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageProvider } from '@/contexts/MessageContext';
import AppHeader from '@/components/builder/AppHeader';
import EditorPanel from '@/components/builder/EditorPanel';
import PreviewPanel from '@/components/builder/PreviewPanel';
import JsonPanel from '@/components/builder/JsonPanel';
import ViewOnlyPage from '@/components/builder/ViewOnlyPage';
import TransactionalPlaceholder from '@/components/builder/TransactionalPlaceholder';
import { useMessage } from '@/contexts/MessageContext';
import { Megaphone, Mail } from 'lucide-react';

type BuilderMode = 'marketing' | 'transactional';

function BuilderLayout() {
  const { message } = useMessage();
  const [builderMode, setBuilderMode] = useState<BuilderMode>('marketing');
  const isHtml = message.platform === 'html';

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AppHeader />

      {/* Mode tabs */}
      <div className="flex items-center gap-1 px-5 py-2 border-b border-border bg-card">
        <button
          type="button"
          onClick={() => setBuilderMode('marketing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            builderMode === 'marketing'
              ? 'bg-primary/10 text-primary border border-primary/25 shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Megaphone size={14} />
          Маркетинговые рассылки
        </button>
        <button
          type="button"
          onClick={() => setBuilderMode('transactional')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            builderMode === 'transactional'
              ? 'bg-primary/10 text-primary border border-primary/25 shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Mail size={14} />
          Транзакционные рассылки
        </button>
      </div>

      {builderMode === 'transactional' ? (
        <div className="flex-1 overflow-hidden">
          <TransactionalPlaceholder />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Editor */}
          <div className={`${isHtml ? 'w-1/2' : 'w-[420px]'} flex-shrink-0 border-r border-border overflow-hidden`}>
            <EditorPanel />
          </div>

          {/* Preview */}
          <div className={`flex-1 ${!isHtml ? 'border-r border-border' : ''} overflow-hidden bg-background`}>
            <PreviewPanel />
          </div>

          {/* JSON - only for Telegram/MAX */}
          {!isHtml && (
            <div className="w-[420px] flex-shrink-0 overflow-hidden">
              <JsonPanel />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const Index = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  if (mode === 'view') {
    return (
      <MessageProvider>
        <ViewOnlyPage />
      </MessageProvider>
    );
  }

  return (
    <MessageProvider>
      <BuilderLayout />
    </MessageProvider>
  );
};

export default Index;
