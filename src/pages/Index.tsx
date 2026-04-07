import { MessageProvider } from '@/contexts/MessageContext';
import AppHeader from '@/components/builder/AppHeader';
import EditorPanel from '@/components/builder/EditorPanel';
import PreviewPanel from '@/components/builder/PreviewPanel';
import JsonPanel from '@/components/builder/JsonPanel';

const Index = () => {
  return (
    <MessageProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <AppHeader />
        <div className="flex-1 flex overflow-hidden">
          {/* Editor */}
          <div className="w-[420px] flex-shrink-0 border-r border-border overflow-hidden">
            <EditorPanel />
          </div>

          {/* Preview */}
          <div className="flex-1 border-r border-border overflow-hidden bg-background">
            <PreviewPanel />
          </div>

          {/* JSON */}
          <div className="w-[420px] flex-shrink-0 overflow-hidden">
            <JsonPanel />
          </div>
        </div>
      </div>
    </MessageProvider>
  );
};

export default Index;
