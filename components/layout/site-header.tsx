"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const focusFrame = window.requestAnimationFrame(() => firstMenuItemRef.current?.focus());
    const desktopQuery = window.matchMedia("(min-width: 901px)");

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target) || menuButtonRef.current?.contains(target)) return;
      setMenuOpen(false);
    }

    function handleViewportChange(event: MediaQueryListEvent) {
      if (event.matches) setMenuOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    desktopQuery.addEventListener("change", handleViewportChange);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
      desktopQuery.removeEventListener("change", handleViewportChange);
    };
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/">
          <span className="brand__mark" aria-hidden="true"><span /></span>
          <span><strong>INVETK</strong><small>Money GPS</small></span>
        </Link>
        <nav ref={menuRef} id="site-menu" className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="주요 메뉴">
          <Link ref={firstMenuItemRef} href="/money-gps" onClick={() => setMenuOpen(false)}>Money GPS</Link>
          <Link href="/policy-benefits" onClick={() => setMenuOpen(false)}>정책 혜택</Link>
          <Link href="/guides" onClick={() => setMenuOpen(false)}>가이드</Link>
          <Link href="/methodology" onClick={() => setMenuOpen(false)}>계산 기준</Link>
          <Link href="/about" onClick={() => setMenuOpen(false)}>소개</Link>
        </nav>
        <Link className="header-cta" href="/money-gps">해결안 만들기</Link>
        <button
          ref={menuButtonRef}
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
