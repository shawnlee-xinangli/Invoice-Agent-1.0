import { tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import { checkDuplicateInvoice, saveInvoiceMetadata } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import type { DataStreamWriter } from 'ai';

interface ProcessInvoiceProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const processInvoice = ({ session, dataStream }: ProcessInvoiceProps) =>
  tool({
    description: 'Process an uploaded invoice document to extract key information',
    parameters: z.object({
      documentId: z.string().describe('The ID of the document to process'),
      invoiceData: z.object({
        vendorName: z.string(),
        invoiceNumber: z.string(),
        amount: z.string(),
        isInvoice: z.boolean().describe('Whether the document appears to be an invoice')
      }),
    }),
    execute: async ({ documentId, invoiceData }) => {
      // Check if this document is not an invoice
      if (!invoiceData.isInvoice) {
        return {
          success: false,
          error: "The uploaded document does not appear to be an invoice",
          documentId
        };
      }
      
      // Check for duplicate invoices
      const isDuplicate = await checkDuplicateInvoice({
        vendorName: invoiceData.vendorName,
        invoiceNumber: invoiceData.invoiceNumber,
        amount: invoiceData.amount
      });
      
      if (isDuplicate) {
        return {
          success: false,
          error: "This appears to be a duplicate invoice",
          isDuplicate: true,
          documentId
        };
      }
      
      // Save invoice metadata
      const invoiceId = generateUUID();
      await saveInvoiceMetadata({
        id: invoiceId,
        documentId,
        vendorName: invoiceData.vendorName,
        invoiceNumber: invoiceData.invoiceNumber,
        amount: invoiceData.amount
      });
      
      return {
        success: true,
        message: "Invoice processed successfully",
        documentId,
        invoiceId
      };
    },
  });