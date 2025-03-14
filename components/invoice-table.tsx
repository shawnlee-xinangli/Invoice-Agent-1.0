'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';

// Column type for sorting
type SortColumn = 'invoiceDate' | 'amount' | 'vendorName';

export function InvoiceTable({ invoices: initialInvoices }) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [sortColumn, setSortColumn] = useState<SortColumn>('invoiceDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Handle column header click for sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    
    // Sort the invoices
    const sortedInvoices = [...invoices].sort((a, b) => {
      if (column === 'amount') {
        const aAmount = parseFloat(a.content.amount.replace(/[^0-9.-]+/g, ''));
        const bAmount = parseFloat(b.content.amount.replace(/[^0-9.-]+/g, ''));
        return sortDirection === 'asc' ? aAmount - bAmount : bAmount - aAmount;
      }
      
      if (column === 'invoiceDate') {
        const aDate = new Date(a.content.invoiceDate);
        const bDate = new Date(b.content.invoiceDate);
        return sortDirection === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
      }
      
      // For text columns like vendorName
      const aValue = a.content[column] || '';
      const bValue = b.content[column] || '';
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    });
    
    setInvoices(sortedInvoices);
  };
  
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('vendorName')}
            >
              Vendor Name {sortColumn === 'vendorName' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('invoiceDate')}
            >
              Date {sortColumn === 'invoiceDate' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead 
              className="cursor-pointer text-right"
              onClick={() => handleSort('amount')}
            >
              Amount {sortColumn === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice: { id: string, content: string }) => {
            const data = JSON.parse(invoice.content);
            return (
              <TableRow key={invoice.id}>
                <TableCell>{data.vendorName}</TableCell>
                <TableCell>{data.customerName}</TableCell>
                <TableCell>{data.invoiceNumber}</TableCell>
                <TableCell>{data.invoiceDate}</TableCell>
                <TableCell>{data.dueDate}</TableCell>
                <TableCell className="text-right">{data.amount}</TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/chat/${invoice.chatId}`)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}