import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function InvoiceEditor({
  content,
  onSaveContent,
  status,
  isCurrentVersion,
}) {
  // Parse the JSON invoice data
  const [invoice, setInvoice] = useState(() => {
    try {
      return JSON.parse(content);
    } catch (e) {
      return {
        customerName: '',
        vendorName: '',
        invoiceNumber: '',
        invoiceDate: '',
        dueDate: '',
        amount: '',
        lineItems: []
      };
    }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  
  // Update a field in the invoice
  const updateField = (field, value) => {
    const updatedInvoice = { ...invoice, [field]: value };
    setInvoice(updatedInvoice);
    onSaveContent(JSON.stringify(updatedInvoice, null, 2), true);
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>Invoice #{invoice.invoiceNumber}</span>
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'View' : 'Edit'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input 
                    id="customerName" 
                    value={invoice.customerName || ''} 
                    onChange={e => updateField('customerName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vendorName">Vendor Name</Label>
                  <Input 
                    id="vendorName" 
                    value={invoice.vendorName || ''} 
                    onChange={e => updateField('vendorName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input 
                    id="invoiceNumber" 
                    value={invoice.invoiceNumber || ''} 
                    onChange={e => updateField('invoiceNumber', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="invoiceDate">Invoice Date</Label>
                  <Input 
                    id="invoiceDate" 
                    type="date"
                    value={invoice.invoiceDate || ''} 
                    onChange={e => updateField('invoiceDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input 
                    id="dueDate" 
                    type="date"
                    value={invoice.dueDate || ''} 
                    onChange={e => updateField('dueDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input 
                    id="amount" 
                    value={invoice.amount || ''} 
                    onChange={e => updateField('amount', e.target.value)}
                  />
                </div>
              </div>
              
              {/* Line items editor would go here */}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Customer</h3>
                  <p>{invoice.customerName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Vendor</h3>
                  <p>{invoice.vendorName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Invoice #</h3>
                  <p>{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Invoice Date</h3>
                  <p>{invoice.invoiceDate}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Due Date</h3>
                  <p>{invoice.dueDate}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Amount</h3>
                  <p>{invoice.amount}</p>
                </div>
              </div>
              
              {invoice.lineItems && invoice.lineItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Line Items</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{item.unitPrice}</TableCell>
                          <TableCell className="text-right">{item.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}