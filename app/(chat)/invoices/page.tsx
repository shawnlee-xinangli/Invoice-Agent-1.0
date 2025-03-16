'use client';

import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/file-upload';
import { useChat } from 'ai/react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceEditDialog } from '@/components/invoice-edit-dialog';
import { Pencil } from 'lucide-react';
import React from 'react';

interface Invoice {
  id: string;
  customerName: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  lineItems: Array<{ description: string; amount: number }>;
  status: 'processed' | 'edited';
  createdAt: Date;
  tokenUsage?: number;
  tokensSaved?: number;
  usedCache?: boolean;
}

type SortField = 'vendorName' | 'invoiceDate' | 'amount';
type SortDirection = 'asc' | 'desc';

// GPT-4 Turbo pricing per 1K tokens (as of March 2024)
const GPT4_PRICING = {
  input: 0.01, // $0.01 per 1K input tokens
  output: 0.03, // $0.03 per 1K output tokens
};

export default function InvoicesPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('invoiceDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const { append, messages, setMessages } = useChat();
  const [averageTokens, setAverageTokens] = useState<number>(0);
  const [averageCost, setAverageCost] = useState<number>(0);
  const [totalTokensSaved, setTotalTokensSaved] = useState<number>(0);
  const [cacheSavings, setCacheSavings] = useState<number>(0);

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Replace the unwanted chat model response with a processing message
  useEffect(() => {
    console.log('messages', messages);  
    if (messages.length >= 2) {
      const lastMessage = messages[messages.length - 1];
      const secondLastMessage = messages[messages.length - 2];
      
      if (secondLastMessage.content === "Process this invoice" &&
          lastMessage.role === "assistant" &&
          lastMessage.content.toLowerCase().includes("please")) {
        // Replace the last message with our processing message
        setMessages([
          ...messages.slice(0, -1),
          {
            id: lastMessage.id,
            role: 'assistant',
            content: 'Processing this invoice...',
            createdAt: lastMessage.createdAt
          }
        ]);
      }
    }
  }, [messages]);

  useEffect(() => {
    if (invoices.length > 0) {
      const totalTokens = invoices.reduce((sum, invoice) => sum + (invoice.tokenUsage || 0), 0);
      const avgTokens = totalTokens / invoices.length;
      setAverageTokens(avgTokens);

      // Calculate total tokens saved
      const saved = invoices.reduce((sum, invoice) => sum + (invoice.tokensSaved || 0), 0);
      setTotalTokensSaved(saved);

      // Calculate cost savings from cache
      const savings = (saved / 1000) * ((GPT4_PRICING.input + GPT4_PRICING.output) / 2);
      setCacheSavings(savings);

      // Estimate cost assuming 50/50 split between input and output tokens
      const avgCost = (avgTokens / 1000) * ((GPT4_PRICING.input + GPT4_PRICING.output) / 2);
      setAverageCost(avgCost);
    }
  }, [invoices]);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoice');
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      const data = await response.json();
      
      // Convert date strings to Date objects
      const processedInvoices = data.map((invoice: any) => ({
        ...invoice,
        invoiceDate: new Date(invoice.invoiceDate),
        dueDate: new Date(invoice.dueDate),
        createdAt: new Date(invoice.createdAt)
      }));
      
      setInvoices(processedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      setIsUploading(true);
      
      // Validate file size
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size must be less than 10MB');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/invoice', {
        method: 'POST',
        body: formData,
      });

      let data;
      try {
        console.log('response', response);  
        data = await response.json();
      } catch (e) {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      // Convert dates to Date objects
      data.invoiceDate = new Date(data.invoiceDate);
      data.dueDate = new Date(data.dueDate);
      data.createdAt = new Date(data.createdAt);
      console.log('data', data);
      console.log('invoice date', data.invoiceDate);
      console.log('dueDate', data.dueDate);

      if (isNaN(data.invoiceDate.getTime()) || isNaN(data.dueDate.getTime())) {
        throw new Error('Invalid date format in response');
      }

      setInvoices((prev) => [data, ...prev]);
      toast.success('Invoice processed successfully');

      append({
        role: 'assistant',
        content: `Successfully processed invoice from ${data.vendorName} for ${(data.amount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
      });
    } catch (error) {
      console.error('Error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(errorMessage);
      append({
        role: 'assistant',
        content: `Error processing invoice: ${errorMessage}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleInvoiceExpansion = (invoiceId: string) => {
    setExpandedInvoices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-1" /> : 
      <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;

    a.invoiceDate = new Date(a.invoiceDate);
    b.invoiceDate = new Date(b.invoiceDate);
    switch (sortField) {
      case 'vendorName':
        return multiplier * a.vendorName.localeCompare(b.vendorName);
      case 'invoiceDate':
        return multiplier * (a.invoiceDate.getTime() - b.invoiceDate.getTime());
      case 'amount':
        return multiplier * (a.amount - b.amount);
      default:
        return 0;
    }
  });

  const handleSaveInvoice = async (updatedInvoice: Invoice) => {
    try {
      const response = await fetch(`/api/invoice/${updatedInvoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedInvoice),
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice');
      }

      // Update the invoices state with the edited invoice
      setInvoices(prevInvoices =>
        prevInvoices.map(invoice =>
          invoice.id === updatedInvoice.id ? updatedInvoice : invoice
        )
      );

      append({
        role: 'assistant',
        content: `Successfully updated invoice from ${updatedInvoice.vendorName}`,
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  };

  const handleEditClick = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation(); // Prevent row expansion when clicking edit
    setEditingInvoice(invoice);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Invoice Processing</h1>
      
      <div className="mb-8">
        <FileUpload onFileSelect={handleFileSelect} isUploading={isUploading} />
      </div>

      {invoices.length > 0 && (
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Processing Statistics</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Average Token Usage</p>
              <p className="text-lg font-medium">{Math.round(averageTokens).toLocaleString()} tokens</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Cost per Invoice</p>
              <p className="text-lg font-medium">
                {averageCost.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 4,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tokens Saved</p>
              <p className="text-lg font-medium">{totalTokensSaved.toLocaleString()} tokens</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cost Savings from Cache</p>
              <p className="text-lg font-medium">
                {cacheSavings.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 4,
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Processed Invoices</h2>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No invoices processed yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('vendorName')}
                >
                  <div className="flex items-center">
                    Vendor
                    {getSortIcon('vendorName')}
                  </div>
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('invoiceDate')}
                >
                  <div className="flex items-center">
                    Date
                    {getSortIcon('invoiceDate')}
                  </div>
                </TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <div className="flex flex-col">
                    <span>Tokens</span>
                    <span className="text-xs text-muted-foreground">(Saved)</span>
                  </div>
                </TableHead>
                <TableHead>AI Cost</TableHead>
                <TableHead 
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end">
                    Amount
                    {getSortIcon('amount')}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInvoices.map((invoice) => (
                <React.Fragment key={invoice.id}>
                  <TableRow 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleInvoiceExpansion(invoice.id)}
                  >
                    <TableCell>
                      {expandedInvoices.has(invoice.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell>{invoice.vendorName}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        invoice.status === 'edited' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{invoice.tokenUsage?.toLocaleString() || '-'}</span>
                        {invoice.tokensSaved ? (
                          <span className="text-xs text-green-600">
                            (-{invoice.tokensSaved.toLocaleString()})
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {invoice.tokenUsage ? (
                            (invoice.tokenUsage / 1000 * ((GPT4_PRICING.input + GPT4_PRICING.output) / 2))
                              .toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 4,
                              })
                          ) : '-'}
                        </span>
                        {invoice.usedCache && (
                          <span className="text-xs text-green-600">Cached ✓</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(invoice.amount / 100).toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        })}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleEditClick(e, invoice)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedInvoices.has(invoice.id) && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-muted/50">
                        <div className="py-2">
                          <h4 className="font-medium mb-2 px-4">Line Items</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {invoice.lineItems.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>{item.description}</TableCell>
                                  <TableCell className="text-right">
                                    {(item.amount / 100).toLocaleString('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                    })}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      {editingInvoice && (
        <InvoiceEditDialog
          invoice={editingInvoice}
          isOpen={true}
          onClose={() => setEditingInvoice(null)}
          onSave={handleSaveInvoice}
        />
      )}
    </div>
  );
} 