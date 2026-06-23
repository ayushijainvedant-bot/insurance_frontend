import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ProductsProvider } from "@/hooks/useProducts";

export const metadata: Metadata = {
  title: "Vedant Insurance Limited — Let's find you the Best Insurance",
  description:
    "Compare term, health, motor and travel insurance from 51+ insurers and choose with confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-paper text-ink font-body antialiased">
        <AuthProvider>
          <ProductsProvider>{children}</ProductsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
