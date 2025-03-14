import { createHash } from 'crypto';

// Simple in-memory cache for now
const promptCache = new Map<string, { response: string; timestamp: number }>();

export function getCachedPrompt(prompt: string, context: string = '') {
  const key = createHash('sha256').update(`${prompt}${context}`).digest('hex');
  const cached = promptCache.get(key);
  
  // Cache entries expire after 24 hours
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    return cached.response;
  }
  
  return null;
}

export function cachePromptResponse(prompt: string, response: string, context: string = '') {
  const key = createHash('sha256').update(`${prompt}${context}`).digest('hex');
  promptCache.set(key, {
    response,
    timestamp: Date.now()
  });
}

// Token estimation based on characters (rough approximation)
export function estimateTokens(text: string): number {
  // A very rough approximation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

// Track token usage for invoices
interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cost: number; // Using current OpenAI pricing as baseline
}

const tokenUsageMap = new Map<string, TokenUsage>();

export function recordTokenUsage(documentId: string, inputTokens: number, outputTokens: number) {
  // Approximate costs using GPT-4 pricing
  const inputCost = inputTokens * 0.00003; // $0.03 per 1000 tokens
  const outputCost = outputTokens * 0.00006; // $0.06 per 1000 tokens
  
  tokenUsageMap.set(documentId, {
    inputTokens,
    outputTokens,
    cost: inputCost + outputCost
  });
  
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    cost: inputCost + outputCost
  };
}

export function getTokenUsage(documentId: string) {
  return tokenUsageMap.get(documentId);
}

export function getAverageTokenUsage() {
  if (tokenUsageMap.size === 0) return null;
  
  let totalInput = 0;
  let totalOutput = 0;
  let totalCost = 0;
  
  for (const usage of tokenUsageMap.values()) {
    totalInput += usage.inputTokens;
    totalOutput += usage.outputTokens;
    totalCost += usage.cost;
  }
  
  return {
    averageInputTokens: totalInput / tokenUsageMap.size,
    averageOutputTokens: totalOutput / tokenUsageMap.size,
    averageTotalTokens: (totalInput + totalOutput) / tokenUsageMap.size,
    averageCost: totalCost / tokenUsageMap.size,
    savedTokens: 0, // This would be populated by the caching logic
    invoiceCount: tokenUsageMap.size
  };
}