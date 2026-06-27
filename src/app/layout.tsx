import type { Metadata, Viewport } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeProvider } from "@/components/ThemeProvider";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-eb-garamond",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://theword.love"),
  title: {
    default: "The Unsealed Revelation",
    template: "%s · The Unsealed Revelation",
  },
  description:
    "A calm, collaborative place to gather the book of Revelation into its plain, pure, and precious form — filtering every word through love, together.",
  openGraph: {
    title: "The Unsealed Revelation",
    description:
      "Gathering the book of Revelation into one place, filtering every word through love. Nothing is final; come and add your light.",
    url: "https://theword.love",
    siteName: "The Unsealed Revelation",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#17150f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${ebGaramond.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <ThemeProvider>
        <a
          href="#main"
          className="ui sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-card focus:px-4 focus:py-2 focus:text-ink focus:shadow"
        >
          Skip to content
        </a>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
