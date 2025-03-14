import { createDocumentHandler } from '@/lib/blocks/server';
import { myProvider } from '@/lib/ai/models';
import { streamObject } from 'ai';
import { z } from 'zod';

export const invoiceDocumentHandler = createDocumentHandler<'invoice'>({
  kind: 'invoice',
  onCreateDocument: async ({ title, dataStream, session }) => {
    let draftContent = '';

    // Use AI to extract invoice data from the uploaded file
    const { fullStream } = streamObject({
      model: myProvider.languageModel('block-model'),
      system: "Extract key information from the invoice: customer name, vendor name, invoice number, date, due date, amount, and line items. Format the response as structured JSON.",
      prompt: title,
      schema: z.object({
        invoice: z.object({
          customerName: z.string(),
          vendorName: z.string(),
          invoiceNumber: z.string(),
          invoiceDate: z.string(),
          dueDate: z.string().optional(),
          amount: z.string(),
          currency: z.string().optional(),
          lineItems: z.array(z.object({
            description: z.string(),
            quantity: z.number().optional(),
            unitPrice: z.number().optional(),
            amount: z.number().optional()
          })).optional(),
          rawText: z.string().optional()
        })
      }),
    });

    for await (const delta of fullStream) {
      if (delta.type === 'object') {
        const { object } = delta;
        const invoiceData = JSON.stringify(object.invoice, null, 2);
        
        dataStream.writeData({
          type: 'invoice-delta',
          content: invoiceData,
        });

        draftContent = invoiceData;
      }
    }

    return draftContent;
  },
  
  onUpdateDocument: async ({ document, description, dataStream }) => {
    // Implementation for updating invoice data
    // Similar to the creation logic but with existing data as context
    let draftContent = '';
    
    const existingData = document.content;
    
    const { fullStream } = streamObject({
      model: myProvider.languageModel('block-model'),
      system: `Update the following invoice data based on the user's instructions:\n${existingData}`,
      prompt: description,
      schema: z.object({
        invoice: z.object({
          customerName: z.string(),
          vendorName: z.string(),
          invoiceNumber: z.string(),
          invoiceDate: z.string(),
          dueDate: z.string().optional(),
          amount: z.string(),
          currency: z.string().optional(),
          lineItems: z.array(z.object({
            description: z.string(),
            quantity: z.number().optional(),
            unitPrice: z.number().optional(),
            amount: z.number().optional()
          })).optional(),
          rawText: z.string().optional()
        })
      }),
    });

    for await (const delta of fullStream) {
      if (delta.type === 'object') {
        const { object } = delta;
        const invoiceData = JSON.stringify(object.invoice, null, 2);
        
        dataStream.writeData({
          type: 'invoice-delta',
          content: invoiceData,
        });

        draftContent = invoiceData;
      }
    }

    return draftContent;
  },
});