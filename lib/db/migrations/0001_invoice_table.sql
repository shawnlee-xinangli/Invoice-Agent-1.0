CREATE TABLE `Invoice` (
  `id` text PRIMARY KEY NOT NULL,
  `createdAt` integer NOT NULL,
  `customerName` text NOT NULL,
  `vendorName` text NOT NULL,
  `invoiceNumber` text NOT NULL,
  `invoiceDate` integer NOT NULL,
  `dueDate` integer NOT NULL,
  `amount` integer NOT NULL,
  `lineItems` blob NOT NULL,
  `status` text DEFAULT 'processed' NOT NULL,
  `originalFileUrl` text NOT NULL,
  `tokenUsage` integer
); 