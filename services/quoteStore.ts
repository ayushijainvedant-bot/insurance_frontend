import type { QuoteContext } from "@/types";

let currentQuoteContext: QuoteContext | null = null;

export function setQuoteContext(ctx: QuoteContext) {
  currentQuoteContext = ctx;
}

export function getQuoteContext(): QuoteContext | null {
  return currentQuoteContext;
}

export function clearQuoteContext() {
  currentQuoteContext = null;
}
