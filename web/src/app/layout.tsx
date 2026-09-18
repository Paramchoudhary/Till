import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Providers } from "./providers";
import { siteUrl } from "@/lib/chains";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const DESCRIPTION =
  "A human creates an invoice. An agent pays it in USDC over HTTP 402. Arc records a final receipt.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Till — agent checkout on Arc",
  description: DESCRIPTION,
  openGraph: {
    title: "Till — agent checkout on Arc",
    description: DESCRIPTION,
    siteName: "Till",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <Providers>
          <Nav />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
