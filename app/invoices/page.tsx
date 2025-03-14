import { auth } from '@/app/(auth)/auth';
import { getInvoices } from '@/lib/db/queries';
import { InvoiceTable } from '../../components/invoice-table';

export default async function InvoicesPage() {
  const session = await auth();
  
  if (!session || !session.user) {
    return <div>Please sign in to view invoices</div>;
  }
  
  const invoices = await getInvoices({});
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Invoices</h1>
      <InvoiceTable invoices={invoices} />
    </div>
  );
}