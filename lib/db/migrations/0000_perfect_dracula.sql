CREATE TABLE `Chat` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`title` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Document` (
	`id` text NOT NULL,
	`createdAt` integer NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`kind` text DEFAULT 'text' NOT NULL,
	PRIMARY KEY(`id`, `createdAt`)
);
--> statement-breakpoint
CREATE TABLE `Message` (
	`id` text PRIMARY KEY NOT NULL,
	`chatId` text NOT NULL,
	`role` text NOT NULL,
	`content` blob NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Suggestion` (
	`id` text PRIMARY KEY NOT NULL,
	`documentId` text NOT NULL,
	`documentCreatedAt` integer NOT NULL,
	`originalText` text NOT NULL,
	`suggestedText` text NOT NULL,
	`description` text,
	`isResolved` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`documentId`,`documentCreatedAt`) REFERENCES `Document`(`id`,`createdAt`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Vote` (
	`chatId` text NOT NULL,
	`messageId` text NOT NULL,
	`isUpvoted` integer NOT NULL,
	PRIMARY KEY(`chatId`, `messageId`),
	FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON UPDATE no action ON DELETE no action
);

-- Add new Invoice table
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
  `processed` integer DEFAULT 0 NOT NULL,
  `processingCost` text,
  `tokenUsage` text,
  `userId` text NOT NULL,
  `createdAt` integer NOT NULL,
  `updatedAt` integer,
  `duplicateChecksum` text UNIQUE,
  FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`),
  FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`),
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
);

-- Create InvoiceLineItem table
CREATE TABLE `InvoiceLineItem` (
  `id` text PRIMARY KEY NOT NULL,
  `invoiceId` text NOT NULL,
  `description` text,
  `quantity` text,
  `unitPrice` text,
  `lineTotal` text,
  `createdAt` integer NOT NULL,
  FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`)
);
