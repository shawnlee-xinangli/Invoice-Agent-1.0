High level goal
Build an interface where company admins can upload vendor invoices and use an AI agent to automatically extract, validate, and manage invoice information.


Recommended technologies
Frontend: Next.js, Shadcn, Tailwind CSS
Backend: Next.js, SQLite
LLM: OpenAI GPT-4o
Agent framework: Vercel AI SDK https://sdk.vercel.ai/docs/introduction. This is included in the starter code. Please learn about this framework and build on top of it.
Feel free to add additional technical dependencies when needed. Use your own API keys for development. We will not reimburse API costs, so please be mindful of usage.

Requirements
A conversational interface to allow admins to upload invoice PDFs or images and ask: 
“Process this invoice”.

Use AI to extract key information:
 Customer name
 Vendor name
 Invoice number
 Invoice date
 Due date
 Amount
 Line items

Save invoices to the database.
Prevent admins from uploading documents that are not invoices, such as receipts and account statements.
Display a table of processed invoices showing key information.
Allow sorting by date, amount, and vendor
Let admins edit AI-extracted information if needed

Bonuses
Prevent company admins from uploading the same invoice twice. 
Make this an agentic behavior. 
In the chat page, AI should reply with a helpful message when it detects duplicate invoices from the same vendor with the same invoice number and amount.
Track token usage for each invoice processed. Measure the average cost per invoice based on token usage.
Implement prompt caching and measure the number of input tokens saved.