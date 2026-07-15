import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/" aria-label="INVETK Money GPS 홈">
          <span className="brand__mark" aria-hidden="true"><span /></span>
          <span><strong>INVETK</strong><small>Money GPS</small></span>
        </Link>
        <nav aria-label="주요 메뉴">
          <Link href="/money-gps">Money GPS</Link>
          <Link href="/money-gps#conditions">선택 비교</Link>
          <Link href="/guides">가이드</Link>
          <Link href="/methodology">계산 기준</Link>
          <Link href="/about">소개</Link>
        </nav>
        <Link className="header-cta" href="/money-gps">계산하기</Link>
      </div>
    </header>
  );
}

