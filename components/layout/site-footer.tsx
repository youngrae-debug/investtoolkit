import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div>
          <div className="footer-brand">INVETK <span>Money GPS</span></div>
          <p>금액을 시간으로 번역해, 오늘의 선택이 목표일을 얼마나 바꾸는지 보여드립니다.</p>
        </div>
        <div className="footer-links" aria-label="푸터 링크">
          <Link href="/about">INVETK 소개</Link>
          <Link href="/methodology">계산 기준</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관·금융 면책</Link>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© 2026 INVETK</span>
        <span>invetk.com · 마지막 업데이트 2026년 7월 15일</span>
      </div>
    </footer>
  );
}

