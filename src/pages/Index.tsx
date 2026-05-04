import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageProvider } from '@/contexts/MessageContext';
import AppHeader from '@/components/builder/AppHeader';
import EditorPanel from '@/components/builder/EditorPanel';
import PreviewPanel from '@/components/builder/PreviewPanel';
import JsonPanel from '@/components/builder/JsonPanel';
import ViewOnlyPage from '@/components/builder/ViewOnlyPage';
import TransactionalPlaceholder from '@/components/builder/TransactionalPlaceholder';
import { useMessage } from '@/contexts/MessageContext';
import { Platform } from '@/lib/message-builder';

type BuilderMode = 'marketing' | 'transactional';

function isPlatform(v: string | null): v is Platform {
  return v === 'telegram' || v === 'max' || v === 'html';
}
function isMode(v: string | null): v is BuilderMode {
  return v === 'marketing' || v === 'transactional';
}

function BuilderLayout({ lockedMode, lockedChannel }: { lockedMode: BuilderMode | null; lockedChannel: Platform | null }) {
  const { message, setPlatform } = useMessage();
  const [builderMode, setBuilderMode] = useState<BuilderMode>(lockedMode || 'marketing');
  const isHtml = message.platform === 'html';

  // Force locked channel on mount
  useEffect(() => {
    if (lockedChannel && message.platform !== lockedChannel) {
      setPlatform(lockedChannel);
    }
    if (lockedMode && builderMode !== lockedMode) {
      setBuilderMode(lockedMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedChannel, lockedMode]);

  const handleModeChange = (m: BuilderMode) => {
    if (lockedMode && m !== lockedMode) return;
    setBuilderMode(m);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AppHeader
        builderMode={builderMode}
        onBuilderModeChange={handleModeChange}
        lockedMode={lockedMode}
        lockedChannel={lockedChannel}
      />

      {builderMode === 'transactional' ? (
        <div className="flex-1 overflow-hidden">
          <TransactionalPlaceholder />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className={`${isHtml ? 'w-1/2' : 'w-[420px]'} flex-shrink-0 border-r border-border overflow-hidden`}>
            <EditorPanel />
          </div>
          <div className={`flex-1 ${!isHtml ? 'border-r border-border' : ''} overflow-hidden bg-background`}>
            <PreviewPanel />
          </div>
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
  const typeParam = searchParams.get('type');
  const channelParam = searchParams.get('channel');

  const lockedMode: BuilderMode | null = isMode(typeParam) ? typeParam : null;
  const lockedChannel: Platform | null = isPlatform(channelParam) ? channelParam : null;

  if (mode === 'view') {
    return (
      <MessageProvider initialPlatform={lockedChannel || 'telegram'} skipPersistence>
        <ViewOnlyPage lockedChannel={lockedChannel} />
      </MessageProvider>
    );
  }

  return (
    <MessageProvider initialPlatform={lockedChannel || 'telegram'}>
      <BuilderLayout lockedMode={lockedMode} lockedChannel={lockedChannel} />
    </MessageProvider>
  );
};

export default Index;
