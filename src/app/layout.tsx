import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: {
    default: "MailForge - Email Marketing Platform",
    template: "%s | MailForge",
  },
  description:
    "Plateforme d'email marketing complète, moderne et multi-tenant pour gérer vos campagnes email.",
  keywords: ["email marketing", "campagne email", "newsletter", "automation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased bg-gray-50 text-gray-900">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
