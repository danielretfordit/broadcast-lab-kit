import { useSearchParams } from 'react-router-dom';
import { MessageProvider } from '@/contexts/MessageContext';
import AppHeader from '@/components/builder/AppHeader';
import EditorPanel from '@/components/builder/EditorPanel';
import PreviewPanel from '@/components/builder/PreviewPanel';
import JsonPanel from '@/components/builder/JsonPanel';
import ViewOnlyPage from '@/components/builder/ViewOnlyPage';
import { useMessage } from '@/contexts/MessageContext';

function BuilderLayout() {
  const { message } = useMessage();
  const isHtml = message.platform === 'html';

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AppHeader />
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
