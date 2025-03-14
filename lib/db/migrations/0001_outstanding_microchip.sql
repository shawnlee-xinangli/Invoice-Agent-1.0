CREATE TABLE `Invoice` (
	`id` text PRIMARY KEY NOT NULL,
	`documentId` text NOT NULL,
	`chatId` text NOT NULL,
	`vendorName` text NOT NULL,
	`customerName` text,
	`invoiceNumber` text NOT NULL,
	`invoiceDate` text,
	`dueDate` text,
	`amount` text NOT NULL,
	`currency` text,
	`processed` integer DEFAULT false NOT NULL,
	`processingCost` text,
	`tokenUsage` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer,
	`duplicateChecksum` text,
	FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Invoice_duplicateChecksum_unique` ON `Invoice` (`duplicateChecksum`);--> statement-breakpoint
CREATE TABLE `InvoiceLineItem` (
	`id` text PRIMARY KEY NOT NULL,
	`invoiceId` text NOT NULL,
	`description` text,
	`quantity` text,
	`unitPrice` text,
	`lineTotal` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `Document` ADD `userId` text NOT NULL;--> statement-breakpoint
ALTER TABLE `Document` ADD `tokenUsage` integer;--> statement-breakpoint
ALTER TABLE `Document` ADD `processingCost` text;