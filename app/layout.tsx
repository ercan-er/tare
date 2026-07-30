import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { CartProvider } from "@/components/cart-provider";
import { WishlistProvider } from "@/components/wishlist-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FirebaseMetrics } from "@/components/firebase-metrics";

export const metadata: Metadata = {
  title: {
    default: "Tare — Coffee equipment",
    template: "%s · Tare",
  },
  description:
    "Grinders, brewers, kettles and scales. The equipment a repeatable cup needs.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/*
          Fonts are loaded with a link tag rather than next/font on purpose.
          next/font fetches from Google at build time, which fails builds on
          restricted CI networks. This path works everywhere.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap"
        />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <FirebaseMetrics />
              <Header />
              <main>{children}</main>
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
