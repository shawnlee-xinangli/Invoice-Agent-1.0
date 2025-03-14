// Simple token tracking for invoice processing

// Rough token estimation based on characters
export function estimateTokens(text: string): number {
    if (!text) return 0;
    // A very rough approximation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }
  
  // In-memory storage of token usage
  const tokenUsageStore: Record<string, {
    invoiceId: string,
    inputTokens: number,
    outputTokens: number,
    timestamp: number
  }> = {};
  
  // Track token usage for an invoice
  export function trackTokenUsage(invoiceId: string, inputTokens: number, outputTokens: number) {
    tokenUsageStore[invoiceId] = {
      invoiceId,
      inputTokens,
      outputTokens,
      timestamp: Date.now()
    };
    
    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens
    };
  }
  
  // Calculate token costs
  export function calculateCost(inputTokens: number, outputTokens: number) {
    // Using approximate GPT-4 pricing
    const inputCost = (inputTokens / 1000) * 0.03; // $0.03 per 1000 tokens
    const outputCost = (outputTokens / 1000) * 0.06; // $0.06 per 1000 tokens
    return inputCost + outputCost;
  }
  
  // Get token usage statistics
  export function getTokenStatistics() {
    const usageValues = Object.values(tokenUsageStore);
    
    if (usageValues.length === 0) {
      return {
        averageInputTokens: 0,
        averageOutputTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        invoiceCount: 0
      };
    }
    
    const totalInputTokens = usageValues.reduce((sum, item) => sum + item.inputTokens, 0);
    const totalOutputTokens = usageValues.reduce((sum, item) => sum + item.outputTokens, 0);
    
    return {
      averageInputTokens: totalInputTokens / usageValues.length,
      averageOutputTokens: totalOutputTokens / usageValues.length,
      totalInputTokens,
      totalOutputTokens,
      totalCost: calculateCost(totalInputTokens, totalOutputTokens),
      invoiceCount: usageValues.length
    };
  }