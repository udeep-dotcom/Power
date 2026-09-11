import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FormFill — Document Automation",
  description: "Automated bank, payment, customs, and operational form filling.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
