import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/provider";
import { AuthProviderContext } from "@/lib/auth/provider";

export const metadata: Metadata = {
  title: "SplitBro",
  description: "Split trip bills accurately.",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <I18nProvider>
          <AuthProviderContext>{children}</AuthProviderContext>
        </I18nProvider>
      </body>
    </html>
  );
}
