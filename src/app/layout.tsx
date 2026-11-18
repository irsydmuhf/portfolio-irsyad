import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { getSeoSettings } from "@/lib/content/home";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Chunky display face for section headings and the hero monitor.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-poppins",
});

const DEFAULT_TITLE = "Irsyad Muhamad Firdaus — Data Analytics Portofolio";
const DEFAULT_DESCRIPTION =
  "Data Analyst turning marketplace, customer, and operational data into actionable business insights. E-commerce analytics, customer retention, reporting automation, and marketplace data pipelines.";

// SEO title/description come from site_settings (admin "Profile & Site");
// empty values fall back to the defaults above.
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  const title = seo?.seoTitle || DEFAULT_TITLE;
  const description = seo?.seoDescription || DEFAULT_DESCRIPTION;
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    ),
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} scroll-smooth`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
