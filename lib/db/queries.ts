import 'server-only';
import { and, asc, desc, eq, gt, gte, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { createHash } from 'crypto';

import {
  chat,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
  invoice,
  type Invoice,
} from './schema';
import type { BlockKind } from '@/components/block';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const sqlite = new Database('sqlite.db');
const db = drizzle(sqlite);

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      // userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      // .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      // userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function getInvoices({ 
  page = 1, 
  pageSize = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc'
}: { 
  page?: number;
  pageSize?: number;
  sortBy?: keyof Invoice;
  sortOrder?: 'asc' | 'desc';
}) {
  try {
    const offset = (page - 1) * pageSize;
    const orderFunction = sortOrder === 'asc' ? asc : desc;
    const orderColumn = invoice[sortBy];

    return await db
      .select()
      .from(invoice)
      .orderBy(orderFunction(orderColumn))
      .limit(pageSize)
      .offset(offset);
  } catch (error) {
    console.error('Failed to get invoices from database', error);
    throw error;
  }
}

// Enhanced duplicate invoice check
export async function checkDuplicateInvoice({ 
  vendorName, 
  invoiceNumber, 
  amount 
}: { 
  vendorName: string; 
  invoiceNumber: string; 
  amount: string;
}) {
  try {
    // Create a checksum for this invoice combination
    const duplicateChecksum = createHash('md5')
      .update(`${vendorName}|${invoiceNumber}|${amount}`)
      .digest('hex');

    // First try checking by checksum if available
    const existingByChecksum = await db
      .select()
      .from(invoice)
      .where(eq(invoice.duplicateChecksum, duplicateChecksum))
      .limit(1);
      
    if (existingByChecksum.length > 0) {
      return true;
    }

    // If no checksum match, check by individual fields
    const existingInvoices = await db
      .select()
      .from(invoice)
      .where(
        and(
          eq(invoice.vendorName, vendorName),
          eq(invoice.invoiceNumber, invoiceNumber),
          eq(invoice.amount, amount)
        )
      )
      .limit(1);

    return existingInvoices.length > 0;
  } catch (error) {
    console.error('Failed to check for duplicate invoice', error);
    // Return false on error to avoid blocking the processing
    // but log the error for investigation
    return false;
  }
}

// Save invoice metadata with more comprehensive details
export async function saveInvoiceMetadata({
  id,
  documentId,
  vendorName,
  customerName = "",
  invoiceNumber,
  invoiceDate = "",
  dueDate = "",
  amount,
  currency = "",
  additionalDetails = {}
}: {
  id: string;
  documentId: string;
  vendorName: string;
  customerName?: string;
  invoiceNumber: string;
  invoiceDate?: string;
  dueDate?: string;
  amount: string;
  currency?: string;
  additionalDetails?: Partial<Omit<Invoice, 'id' | 'documentId' | 'vendorName' | 'invoiceNumber' | 'amount'>>
}) {
  try {
    // Generate checksum for duplicate detection
    const duplicateChecksum = createHash('md5')
      .update(`${vendorName}|${invoiceNumber}|${amount}`)
      .digest('hex');

    // Insert the invoice record
    return await db.insert(invoice).values({
      id,
      documentId,
      vendorName,
      customerName,
      invoiceNumber,
      invoiceDate,
      dueDate,
      amount,
      currency,
      processed: true,
      duplicateChecksum,
      createdAt: new Date(),
      ...additionalDetails
    });
  } catch (error) {
    console.error('Failed to save invoice metadata', error);
    throw error;
  }
}
// Update invoice with more flexibility
export async function updateInvoiceById({
  id,
  updates
}: {
  id: string;
  updates: Partial<Omit<Invoice, 'id'>>
}) {
  try {
    return await db
      .update(invoice)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(invoice.id, id));
  } catch (error) {
    console.error('Failed to update invoice');
    throw error;
  }
}

// Get invoice by ID with more detailed retrieval
export async function getInvoiceById({ id }: { id: string }) {
  try {
    const [selectedInvoice] = await db
      .select()
      .from(invoice)
      .where(eq(invoice.id, id));

    return selectedInvoice;
  } catch (error) {
    console.error('Failed to get invoice by id');
    throw error;
  }
}

// Token usage and cost tracking
export async function recordInvoiceProcessingCost({
  invoiceId,
  inputTokens,
  outputTokens
}: {
  invoiceId: string;
  inputTokens: number;
  outputTokens: number;
}) {
  try {
    // Rough cost estimation based on OpenAI pricing
    const inputCost = inputTokens * 0.00003; // $0.03 per 1000 tokens
    const outputCost = outputTokens * 0.00006; // $0.06 per 1000 tokens
    const totalCost = inputCost + outputCost;

    return await db
      .update(invoice)
      .set({
        processingCost: totalCost.toFixed(4),
        tokenUsage: JSON.stringify({ 
          inputTokens, 
          outputTokens, 
          totalTokens: inputTokens + outputTokens,
          estimatedCost: totalCost.toFixed(4)
        })
      })
      .where(eq(invoice.id, invoiceId));
  } catch (error) {
    console.error('Failed to record invoice processing cost');
    throw error;
  }
}