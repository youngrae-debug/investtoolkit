import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div>
          <div className="footer-brand">INVETK <span>Money GPS</span></div>
          <p>목표 날짜의 부족분과 해결안을 계산하고, 놓치기 쉬운 정책 혜택까지 함께 찾습니다.</p>
        </div>
        <div className="footer-links" aria-label="푸터 링크">
          <Link href="/about">INVETK 소개</Link>
          <Link href="/policy-benefits">정책 혜택 찾기</Link>
          <Link href="/methodology">계산 기준</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관·금융 면책</Link>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© 2026 INVETK</span>
        <span>invetk.com · 마지막 업데이트 2026년 7월 16일</span>
      </div>
    </footer>
  );
}
