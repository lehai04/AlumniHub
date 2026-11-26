import Link from "next/link";
import type { ReactNode } from "react";
import { publicNavigation } from "../../lib/public-pages";
import { BrandMark } from "../components/brand-mark";
import { PublicNav } from "./public-nav";
import "./public.css";
import "./news/news.css";
import "./career/career.css";
import "./community/community.css";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-site">
      <header className="site-header">
        <div className="shell header-inner">
          <Link className="brand" href="/" aria-label="Alumni Hub, trang chủ">
            <BrandMark />
          </Link>
          <PublicNav />
          <Link className="button button-primary header-card" href="/account">
            Tài khoản
          </Link>
        </div>
      </header>
      <main id="main" className="shell public-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="shell footer-inner">
          <Link className="brand footer-brand" href="/">
            <BrandMark />
          </Link>
          <nav className="footer-links" aria-label="Khám phá Alumni Hub">
            <strong>Khám phá</strong>
            {publicNavigation.map(({ href, label }) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <nav className="footer-links" aria-label="Tài khoản và Nhà trường">
            <strong>Tài khoản và Nhà trường</strong>
            <Link href="/account">Tài khoản cựu sinh viên</Link>
            <a
              href="https://vhub.vlu.edu.vn/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Thủ tục hành chính VHub ↗
            </a>
            <a href="https://www.vlu.edu.vn/">Trường Đại học Văn Lang ↗</a>
            <a href="#main">Về đầu nội dung ↑</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
