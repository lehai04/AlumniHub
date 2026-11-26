import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privateRobots } from "../../../lib/seo";

export const metadata: Metadata = {
  title: "Tài khoản Alumni",
  robots: privateRobots,
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
