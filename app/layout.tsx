import type { Metadata, Viewport } from "next";
import { sitePath } from "@/app/lib/paths";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/app/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: SITE_NAME,
  manifest: sitePath("/manifest.webmanifest"),
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NFL Games Today: Times & TV Channels | Who Plays Tonight",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "NFL games today",
    "who plays tonight",
    "NFL schedule today",
    "what channel is the NFL game on",
    "NFL game time tonight",
    "how to watch NFL games",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: "NFL Games Today: Times & TV Channels | Who Plays Tonight",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: "NFL Games Today: Times & TV Channels | Who Plays Tonight",
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: sitePath("/favicon.svg"),
    shortcut: sitePath("/favicon.svg"),
    apple: sitePath("/pwa-192.png"),
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#111410",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };

  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
