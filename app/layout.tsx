import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://storepulse.app"),
  title: {
    default: "StorePulse — App ratings by country",
    template: "%s | StorePulse"
  },
  description: "Compare app ratings and review counts across 60+ App Store and Google Play storefronts worldwide.",
  keywords: ["app ratings by country", "App Store ratings", "Google Play ratings", "app review analytics", "global app intelligence"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", locale: "en_US", url: "/", siteName: "StorePulse", title: "StorePulse — App ratings by country", description: "Compare app ratings and review counts across 60+ storefronts worldwide." },
  twitter: { card: "summary", title: "StorePulse — App ratings by country", description: "Compare app ratings and review counts across 60+ storefronts worldwide." }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "StorePulse",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Global app-store rating and review-count comparison across App Store and Google Play storefronts.",
    url: "https://storepulse.app",
    featureList: "Compare app ratings by country, App Store analytics, Google Play analytics, review-count comparison"
  };
  return <html lang="en"><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></body></html>;
}
