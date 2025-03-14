import { Block } from '@/components/create-block';
import { CopyIcon, RedoIcon, UndoIcon } from '@/components/icons';
import { InvoiceEditor } from '@/components/invoice-editor';
import { toast } from 'sonner';

export const invoiceBlock = new Block({
  kind: 'invoice',
  description: 'Useful for processing and viewing invoice data',
  initialize: async ({ documentId, setMetadata }) => {
    // Initialize metadata if needed
    setMetadata({
      isProcessed: false,
      tokenUsage: {
        input: 0,
        output: 0,
        total: 0
      }
    });
  },
  onStreamPart: ({ streamPart, setBlock }) => {
    if (streamPart.type === 'invoice-delta') {
      setBlock((draftBlock) => ({
        ...draftBlock,
        content: streamPart.content as string,
        isVisible: true,
        status: 'streaming',
      }));
    }
  },
  content: InvoiceEditor, // We'll create this component next
  actions: [
    // Similar to existing blocks' actions
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard!');
      },
    },
  ],
  toolbar: [
    // Tool actions for invoice processing
  ],
});