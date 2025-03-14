import { tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import type { DataStreamWriter } from 'ai';
import { createHash } from 'crypto';
import { generateUUID } from '@/lib/utils';
import { saveInvoiceMetadata, checkDuplicateInvoice, recordInvoiceProcessingCost } from '@/lib/db/queries';
import { estimateTokens } from '@/lib/ai/token-tracking';

interface ProcessInvoiceProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const processInvoice = ({ session, dataStream }: ProcessInvoiceProps) =>
  tool({
    description: 'Process an uploaded invoice document to extract key information',
    parameters: z.object({
      documentId: z.string().describe('The ID of the document being processed'),
      invoiceData: z.object({
        vendorName: z.string().describe('Name of the vendor or supplier'),
        customerName: z.string().optional().describe('Name of the customer'),
        invoiceNumber: z.string().describe('Invoice reference number'),
        invoiceDate: z.string().optional().describe('Date when the invoice was issued'),
        dueDate: z.string().optional().describe('Date when payment is due'),
        amount: z.string().describe('Total amount of the invoice'),
        currency: z.string().optional().describe('Currency code (e.g., USD, EUR)'),
        lineItems: z.array(
          z.object({
            description: z.string(),
            quantity: z.number().optional(),
            unitPrice: z.number().optional(),
            amount: z.number().optional()
          })
        ).optional().describe('Individual line items on the invoice'),
        isInvoice: z.boolean().describe('Whether the document appears to be an invoice')
      }),
      inputText: z.string().optional().describe('The original text from the invoice for token calculation')
    }),
    execute: async ({ documentId, invoiceData, inputText }) => {
      // Check if this document is actually an invoice
      if (!invoiceData.isInvoice) {
        return {
          success: false,
          error: "The uploaded document does not appear to be an invoice. It might be a receipt or other document type.",
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
          error: "This appears to be a duplicate invoice. An invoice with the same vendor name, invoice number, and amount has already been processed.",
          isDuplicate: true,
          documentId
        };
      }

      // Generate checksum for duplicate detection
      const duplicateChecksum = createHash('md5')
        .update(`${invoiceData.vendorName}|${invoiceData.invoiceNumber}|${invoiceData.amount}`)
        .digest('hex');

      // Save invoice to database
      const invoiceId = generateUUID();
      await saveInvoiceMetadata({
        id: invoiceId,
        documentId,
        vendorName: invoiceData.vendorName,
        customerName: invoiceData.customerName || '',
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate || '',
        dueDate: invoiceData.dueDate || '',
        amount: invoiceData.amount,
        currency: invoiceData.currency || '',
        additionalDetails: {
          duplicateChecksum,
          createdAt: new Date()
        }
      });

      // Track token usage if inputText is provided
      if (inputText) {
        const inputTokens = estimateTokens(inputText);
        const outputTokens = estimateTokens(JSON.stringify(invoiceData));
        
        // Record token usage
        await recordInvoiceProcessingCost({
          invoiceId,
          inputTokens,
          outputTokens
        });
        
        return {
          success: true,
          message: "Invoice processed successfully",
          documentId,
          invoiceId,
          details: {
            vendorName: invoiceData.vendorName,
            invoiceNumber: invoiceData.invoiceNumber,
            amount: invoiceData.amount,
            date: invoiceData.invoiceDate
          },
          tokenUsage: {
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens
          }
        };
      }

      return {
        success: true,
        message: "Invoice processed successfully",
        documentId,
        invoiceId,
        details: {
          vendorName: invoiceData.vendorName,
          invoiceNumber: invoiceData.invoiceNumber,
          amount: invoiceData.amount,
          date: invoiceData.invoiceDate
        }
      };
    },
  });