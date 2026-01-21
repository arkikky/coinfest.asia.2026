import type { Metadata } from "next";
import QueryProvider from "@/hooks/Providers/QueryProvider";
import { OrderItemsProvider } from "@/stores/OrderStore";

// @provide(css)
import "./globals.css";

// @metadata
export const metadata: Metadata = {
  title: {
    default: "ICN Organizers",
    template: "%s | ICN Organizers",
  },
  description: "ICN Oraganizers",
  generator: "ICN-Oraganizers.app",
  authors: [
    {
      name: "Indonesia Crypto Network (ICN)",
      url: "https://indonesiacrypto.network",
    },
  ],
  creator: "Indonesia Crypto Network (ICN)",
  publisher: "Indonesia Crypto Network (ICN)",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`antialiased`}>
        <OrderItemsProvider>
          <QueryProvider>{children}</QueryProvider>
        </OrderItemsProvider>
      </body>
    </html>
  );
}
