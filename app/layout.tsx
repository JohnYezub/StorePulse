import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StorePulse — оценки приложений",
  description: "Рейтинги и отзывы приложений по странам и магазинам"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
