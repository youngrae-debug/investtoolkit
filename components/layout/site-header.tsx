"use client";

import Link from "next/link";
import { useState } from "react";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/" aria-label="INVETK Money GPS 홈">
          <span className="brand__mark" aria-hidden="true"><span /></span>
          <span><strong>INVETK</strong><small>Money GPS</small></span>
        </Link>
        <nav id="site-menu" className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="주요 메뉴">
          <Link href="/money-gps" onClick={() => setMenuOpen(false)}>Money GPS</Link>
          <Link href="/policy-benefits" onClick={() => setMenuOpen(false)}>정책 혜택</Link>
          <Link href="/guides" onClick={() => setMenuOpen(false)}>가이드</Link>
          <Link href="/methodology" onClick={() => setMenuOpen(false)}>계산 기준</Link>
          <Link href="/about" onClick={() => setMenuOpen(false)}>소개</Link>
        </nav>
        <Link className="header-cta" href="/money-gps">해결안 만들기</Link>
        <button
          className="mobile-menu-button"
          type="button"
          aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
