import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { readStaffSession } from "../../lib/backend";
import { privateRobots } from "../../lib/seo";
import { BrandMark } from "../components/brand-mark";
import { SessionForm } from "../components/session-form";
import { CmsNavigation } from "./cms-navigation";
import "./cms.css";

export const metadata: Metadata = { title: "Quản trị", robots: privateRobots };

export default async function CmsLayout({ children }: { children: ReactNode }) {
  const { account } = await readStaffSession();
  const admin = account?.role === "admin";
  const reviewer = account?.role === "reviewer";
  return (
    <div className={`cms-shell${admin || reviewer ? "" : " cms-shell-guest"}`}>
      <aside className="cms-sidebar">
        <Link className="cms-brand" href="/admin">
          <BrandMark />
          <span>
            <strong>Alumni Hub</strong>
            <small>Quản trị</small>
          </span>
        </Link>
        {(admin || reviewer) && <CmsNavigation reviewer={reviewer} />}
      </aside>
      <div className="cms-workspace">
        <div className="cms-topbar">
          <Link href="/">← Website Alumni Hub</Link>
          {account && <SessionForm signedIn portal="staff" />}
        </div>
        <main className="cms-content" id="main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
