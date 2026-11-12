import type { Metadata } from "next";
import "./globals.css";
import { getT } from "@/lib/texts/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const title = t("site.title");
  return { title: { default: title, template: `%s | ${title}` }, description: t("site.description") };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
