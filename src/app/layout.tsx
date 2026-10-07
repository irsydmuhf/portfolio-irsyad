import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: "Irsyad Muhamad Firdaus — Data Analytics Portfolio",
  description:
    "Data Analyst turning marketplace, customer, and operational data into actionable business insights. E-commerce analytics, customer retention, reporting automation, and marketplace data pipelines.",
  openGraph: {
    title: "Irsyad Muhamad Firdaus — Data Analytics Portfolio",
    description:
      "Data Analyst turning marketplace, customer, and operational data into actionable business insights.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
