import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InvestToolkit | 투자자의 모든 계산을 하나의 사이트에서',
  description: '복리, 배당, FIRE, ETF, 연금까지. 계산 결과와 해석을 함께 제공하는 투자 계산기 플랫폼',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
