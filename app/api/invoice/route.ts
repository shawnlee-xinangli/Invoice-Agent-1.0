import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { invoice } from '@/lib/db/schema';
import { pdfToText } from '@/utils/file-extractor';
import { desc, eq, and } from 'drizzle-orm';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const systemPrompt = `You are an expert invoice processor. Your task is to extract key information from the provided invoice text.
Please analyze the document and extract the following information in a structured JSON format:
- customerName
- vendorName
- invoiceNumber
- invoiceDate (in ISO format)
- dueDate (in ISO format)
- amount (in cents)
- lineItems (array of objects with description and amount)

First, verify that this is actually an invoice document. If it's not an invoice (e.g. it's a receipt or statement), respond with: {"error": "This document is not an invoice"}
If it is an invoice, respond with the extracted information in JSON format, not markdown (no \`\`\`json or \`\`\`).

Important: 
- Dates must be in ISO format (YYYY-MM-DD)
- Amount must be in cents (multiply dollar amount by 100)
- All fields are required`;

// Helper function to convert PDF to text
// async function pdfToText(buffer: Buffer): Promise<string> {
//   const data = await pdfParse(buffer);
//   return data.text;
// }

// Helper function to process image with OCR
async function imageToText(buffer: Buffer): Promise<string> {
  // Convert image to PNG format for better OCR results
  const pngBuffer = await sharp(buffer)
    .png()
    .toBuffer();

  const worker = await createWorker('eng', 1, {
    logger: m => console.log(m), // Add logger here
    workerPath: "./node_modules/tesseract.js/src/worker-script/node/index.js"
  });
  const result = await worker.recognize(pngBuffer);
  await worker.terminate();

  return result.data.text;
}

const errorResponse = (message: string, status = 400) => {
  return NextResponse.json(
    { error: message },
    { status }
  );
};

// GET handler to fetch all invoices
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return errorResponse('Unauthorized', 401);
    }

    // Fetch all invoices, ordered by creation date (newest first)
    const invoices = await db.select().from(invoice).orderBy(desc(invoice.createdAt));
    
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return errorResponse(error.message || 'Error fetching invoices', 500);
  }
}

// POST handler for invoice processing
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return errorResponse('Unauthorized', 401);
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return errorResponse('OpenAI API key not configured', 500);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return errorResponse('No file provided');
    }

    console.log('File received:', {
      type: file.type,
      size: file.size,
      name: file.name
    });

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse(`Invalid file type: ${file.type}. Please upload a PDF or image file (JPEG/PNG)`);
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return errorResponse('File too large. Maximum size is 10MB');
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text based on file type
    let extractedText = '';
    try {
      extractedText = 'test';

      if (file.type === 'application/pdf') {
        extractedText = await pdfToText(buffer);
      } else {
        extractedText = await imageToText(buffer);
      }
      console.log('Extracted text length:', extractedText.length);
    } catch (error) {
      console.error('Text extraction error:', error);
      return errorResponse('Failed to extract text from file');
    }

    if (!extractedText.trim()) {
      return errorResponse('No text could be extracted from the file');
    }

    // Process the extracted text with OpenAI
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Here's the text extracted from the invoice. Please process it:\n\n${extractedText}`
          }
        ]
      });

      const completion = response.choices[0].message.content;
      if (!completion) {
        return errorResponse('No response from OpenAI', 500);
      }
      console.log('Completion:', completion);
      // Parse the JSON response
      const parsedData = JSON.parse(completion);

      // Check if the AI detected that this is not an invoice
      if (parsedData.error) {
        return errorResponse(parsedData.error);
      }

      // Validate required fields
      const requiredFields = ['customerName', 'vendorName', 'invoiceNumber', 'invoiceDate', 'dueDate', 'amount', 'lineItems'];
      for (const field of requiredFields) {
        if (!parsedData[field]) {
          return errorResponse(`Missing required field in AI response: ${field}`);
        }
      }

      // Check for duplicate invoice (vendor name, number, and amount)
      const existingInvoice = await db.select()
        .from(invoice)
        .where(
          and(
            eq(invoice.vendorName, parsedData.vendorName),
            eq(invoice.invoiceNumber, parsedData.invoiceNumber)
          )
        )
        .limit(1);

      if (existingInvoice.length > 0) {
        // If we found an invoice with the same vendor and number, check if amount matches
        if (existingInvoice[0].amount === parsedData.amount) {
          return errorResponse(
            `Duplicate invoice detected: Invoice number ${parsedData.invoiceNumber} from vendor "${parsedData.vendorName}" with amount ${parsedData.amount / 100} already exists`
          );
        }
      }

      // Validate date formats
      const invoiceDate = new Date(parsedData.invoiceDate);
      const dueDate = new Date(parsedData.dueDate);
      if (isNaN(invoiceDate.getTime()) || isNaN(dueDate.getTime())) {
        return errorResponse('Invalid date format in AI response');
      }

      // Add an ID to the response
      const responseWithId = {
        id: nanoid(),
        ...parsedData,
        createdAt: new Date(),
        status: 'processed',
        originalFileUrl: '', // TODO: Implement file storage
        tokenUsage: response.usage?.total_tokens
      };

      responseWithId['invoiceDate'] = invoiceDate;
      responseWithId['dueDate'] = dueDate;

      console.log('Response with ID:', responseWithId);

      // Store in database
      await db.insert(invoice).values(responseWithId);
      return NextResponse.json(responseWithId);
    } catch (error) {
      console.error('OpenAI or parsing error:', error);
      return errorResponse('Failed to process invoice data');
    }
  } catch (error: any) {
    console.error('Server error:', error);
    return errorResponse(error.message || 'Error processing invoice', 500);
  }
} 