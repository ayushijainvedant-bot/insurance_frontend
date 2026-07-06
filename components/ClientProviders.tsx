"use client";

import { usePathname } from "next/navigation";

import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { ProductsProvider } from "@/hooks/useProducts";
import { QuoteModalProvider } from "@/hooks/useQuoteModal";
import { SelectedFiltersProvider } from "@/hooks/useSelectedFilters";

/**
 * Customer-facing context providers. The CMS/admin area under /cms has its own
 * AdminAuthProvider and doesn't use any of these, so we skip mounting them there
 * — otherwise every admin page would needlessly fire /user/products and
 * /user/cart on load.
 */
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/cms")) return <>{children}</>;

  return (
    <AuthProvider>
      <CartProvider>
        <ProductsProvider>
          <SelectedFiltersProvider>
            <QuoteModalProvider>{children}</QuoteModalProvider>
          </SelectedFiltersProvider>
        </ProductsProvider>
      </CartProvider>
    </AuthProvider>
  );
}
