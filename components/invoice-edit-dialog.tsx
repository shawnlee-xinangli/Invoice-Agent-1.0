import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface InvoiceEditDialogProps {
  invoice: {
    id: string;
    customerName: string;
    vendorName: string;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    amount: number;
    lineItems: Array<{ description: string; amount: number }>;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedInvoice: any) => void;
}

export function InvoiceEditDialog({ invoice, isOpen, onClose, onSave }: InvoiceEditDialogProps) {
  
  const [formData, setFormData] = useState({
    customerName: invoice.customerName,
    vendorName: invoice.vendorName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate instanceof Date 
      ? invoice.invoiceDate.toISOString().split('T')[0]
      : invoice.invoiceDate,
    dueDate: invoice.dueDate instanceof Date 
      ? invoice.dueDate.toISOString().split('T')[0]
      : invoice.dueDate,
    amount: invoice.amount / 100, // Convert cents to dollars for display
    lineItems: invoice.lineItems.map(item => ({
      ...item,
      amount: item.amount / 100 // Convert cents to dollars for display
    }))
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLineItemChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            [field]: field === 'amount' ? parseFloat(value) || 0 : value
          };
        }
        return item;
      })
    }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', amount: 0 }]
    }));
  };

  const removeLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validate form data
      if (!formData.customerName || !formData.vendorName || !formData.invoiceNumber) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Convert amounts back to cents
      const updatedInvoice = {
        ...invoice,
        ...formData,
        amount: Math.round(formData.amount * 100),
        lineItems: formData.lineItems.map(item => ({
          ...item,
          amount: Math.round(item.amount * 100)
        })),
        status: 'edited'
      };

      // Call the onSave callback with the updated invoice
      await onSave(updatedInvoice);
      onClose();
      toast.success('Invoice updated successfully');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                value={formData.vendorName}
                onChange={(e) => handleInputChange('vendorName', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Total Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {formData.lineItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => handleLineItemChange(index, 'amount', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 