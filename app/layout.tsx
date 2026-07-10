import type { Metadata } from 'next';
import './globals.css';
import './portfolio.css';
import './fixes.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://invetk.com'),
  title: 'InvestToolkit | 투자자의 모든 계산을 하나의 사이트에서',
  description: '미국주식 수익, 환율, ETF 보수, 세후 배당, 적립매수까지 한국 투자자를 위한 투자 계산기 플랫폼',
  openGraph:{title:'InvestToolkit',description:'투자자의 모든 계산을 하나의 사이트에서',url:'https://invetk.com',siteName:'InvestToolkit',locale:'ko_KR',type:'website'},
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
