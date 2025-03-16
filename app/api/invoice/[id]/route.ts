import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { invoice } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const errorResponse = (message: string, status = 400) => {
  return NextResponse.json(
    { error: message },
    { status }
  );
};

type Props = {
  params: { id: string }
}

export async function PUT(
  request: NextRequest,
  props: Props
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return errorResponse('Unauthorized', 401);
    }

    const { id: invoiceId } = await Promise.resolve(props.params);
    const data = await request.json();

    // Validate required fields
    const requiredFields = ['customerName', 'vendorName', 'invoiceNumber', 'invoiceDate', 'dueDate', 'amount', 'lineItems'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return errorResponse(`Missing required field: ${field}`);
      }
    }

    // Convert dates to timestamps
    const invoiceDate = new Date(data.invoiceDate);
    const dueDate = new Date(data.dueDate);

    if (isNaN(invoiceDate.getTime()) || isNaN(dueDate.getTime())) {
      return errorResponse('Invalid date format');
    }

    // Update the invoice
    await db.update(invoice)
      .set({
        customerName: data.customerName,
        vendorName: data.vendorName,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: invoiceDate,
        dueDate: dueDate,
        amount: data.amount,
        lineItems: data.lineItems,
        status: 'edited'
      })
      .where(eq(invoice.id, invoiceId));

    // Fetch the updated invoice
    const [updatedInvoice] = await db.select()
      .from(invoice)
      .where(eq(invoice.id, invoiceId))
      .limit(1);

    if (!updatedInvoice) {
      return errorResponse('Invoice not found', 404);
    }

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return errorResponse(error.message || 'Error updating invoice', 500);
  }
} 