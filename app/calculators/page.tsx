import Link from 'next/link';
import {ChevronRight,TrendingUp} from 'lucide-react';
import CalculatorHub from '@/components/calculator-hub';
import {calculators} from '@/lib/calculators';
export const metadata={title:'전체 투자 계산기 | InvestToolkit',description:'복리, 배당, FIRE, ETF, 미국주식, 대출, 예금, 연금까지 20개의 무료 금융 계산기를 이용하세요.'};
export default function Page(){return <main className="calculatorPage"><header className="calcHeader"><div className="wrap"><Link className="brand" href="/"><span className="brandmark"><TrendingUp size={20}/></span><span>Invest<span>Toolkit</span></span></Link><Link href="/">홈으로</Link></div></header><section className="hubHero"><div className="wrap"><div className="breadcrumb"><Link href="/">홈</Link><ChevronRight/><b>전체 계산기</b></div><span>20 FREE CALCULATORS</span><h1>내게 필요한 금융 계산을<br/>빠르게 시작하세요.</h1><p>투자 계획부터 배당, 대출, 은퇴 준비까지 검증 가능한 공식으로 계산합니다.</p></div></section><section className="wrap hubContent"><CalculatorHub items={calculators}/></section></main>}

