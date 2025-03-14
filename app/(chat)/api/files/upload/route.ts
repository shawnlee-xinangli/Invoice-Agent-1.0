import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Basic validation
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size should be less than 10MB' }, { status: 400 });
    }

    // Check if file is PDF or image
    const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!acceptedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'File must be a PDF, JPEG, or PNG' 
      }, { status: 400 });
    }

    // Convert to base64 for immediate use
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    const dataURL = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${file.name}`;

    return NextResponse.json({
      url: dataURL,
      pathname: `/uploads/${uniqueFilename}`,
      contentType: file.type
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file upload' },
      { status: 500 },
    );
  }
}