import pdfParse from 'pdf-parse';

// Helper function to process PDF documents
export async function pdfToText(buffer: Buffer): Promise<string> {
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
