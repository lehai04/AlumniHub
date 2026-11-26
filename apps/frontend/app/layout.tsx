import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteDescription, siteName } from "../lib/seo";
import "./base.css";
import "./events.css";

export const metadata: Metadata = {
  title: { default: siteName, template: "%s | Alumni Hub" },
  description: siteDescription,
  icons: "/assets/favicon.svg",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <a className="skip-link" href="#main">
          Đến nội dung chính
        </a>
        {children}
      </body>
    </html>
  );
}
