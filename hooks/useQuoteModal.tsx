"use client";

import { createContext, useCallback, useContext, useState } from "react";

import GetQuoteModal from "@/components/GetQuoteModal";
import type { QuoteTabId } from "@/types";

interface QuoteModalContextValue {
  /** Open the quote modal. Pass a plan id to jump straight to its form;
   *  omit it to start at the plan picker (the navbar "Get Best Quote"). */
  openQuote: (plan?: QuoteTabId) => void;
}

const QuoteModalContext = createContext<QuoteModalContextValue | null>(null);

/**
 * Single, app-wide quote modal (the project's Context-API pattern, like
 * AuthProvider/ProductsProvider). Renders one GetQuoteModal and lets any
 * component open it — the navbar button and every plan card's "Get Quote".
 */
export function QuoteModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [preselect, setPreselect] = useState<QuoteTabId | null>(null);

  const openQuote = useCallback((plan?: QuoteTabId) => {
    setPreselect(plan ?? null);
    setOpen(true);
  }, []);

  return (
    <QuoteModalContext.Provider value={{ openQuote }}>
      {children}
      <GetQuoteModal open={open} onOpenChange={setOpen} preselect={preselect} />
    </QuoteModalContext.Provider>
  );
}

export function useQuoteModal() {
  const ctx = useContext(QuoteModalContext);
  if (!ctx) throw new Error("useQuoteModal must be used within a <QuoteModalProvider>");
  return ctx;
}
