import type { Metadata } from "next";
import { getSettings } from "@/lib/db";
import { CartProvider } from "@/components/CartProvider";
import "./globals.css";

export function generateMetadata(): Metadata {
  const settings = getSettings();
  return {
    title: {
      default: `${settings.siteName} — ${settings.tagline}`,
      template: `%s — ${settings.siteName}`,
    },
    description: settings.heroText,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
