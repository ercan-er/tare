import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { CartProvider } from "@/components/cart-provider";
import { WishlistProvider } from "@/components/wishlist-provider";
import { FavoriteCategoriesProvider } from "@/components/favorite-categories";
import { ToastProvider } from "@/components/toast-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorker } from "@/components/service-worker";
import { PromoBar } from "@/components/promo-bar";
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
  appleWebApp: {
    capable: true,
    title: "Tare",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#FBFAF8",
};

// Boya oncesi <html data-theme> ayarlanir; boylece koyu temada acik renk
// parlamasi (FOUC) olmaz. localStorage yoksa OS tercihine bakar.
const NO_FLASH = `(function(){try{var t=localStorage.getItem('tare:theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);var r=d?'dark':'light';document.documentElement.dataset.theme=r;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'#14100D':'#FBFAF8');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
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
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <FavoriteCategoriesProvider>
                    <ToastProvider>
                      <FirebaseMetrics />
                      <ServiceWorker />
                      <PromoBar />
                      <Header />
                      <main>{children}</main>
                      <Footer />
                    </ToastProvider>
                  </FavoriteCategoriesProvider>
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
