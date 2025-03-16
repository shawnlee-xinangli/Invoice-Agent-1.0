import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';

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
If it is an invoice, respond with the extracted information in JSON format.

Important: 
- Dates must be in ISO format (YYYY-MM-DD)
- Amount must be in cents (multiply dollar amount by 100)
- All fields are required`;

// Helper function to process PDF documents
async function pdfToText(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text;
}

// Helper function to process image with OCR
// async function imageToText(buffer: Buffer): Promise<string> {
//     // Convert image to PNG format for better OCR results
//     const pngBuffer = await sharp(buffer)
//         .png()
//         .toBuffer();

//     const worker = await createWorker('eng');
//     const { data: { text } } = await worker.recognize(pngBuffer);
//     await worker.terminate();

//     return text;
// }

export async function GET(request: NextRequest) {
    console.log('GET request received');
    return NextResponse.json({ status: 'ok' });
}

export async function POST(request: NextRequest) {
    return NextResponse.json({ status: 'ok' });
}
