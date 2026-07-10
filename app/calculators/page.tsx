import Link from 'next/link';
import {ChevronRight,TrendingUp} from 'lucide-react';
import CalculatorHub from '@/components/calculator-hub';
import {calculators} from '@/lib/calculators';
export const metadata={title:'미국주식·ETF 투자 계산기 | InvestToolkit',description:'미국주식 수익, 환율 효과, ETF 보수, 배당 목표, 적립매수 등 25개의 무료 투자 계산기를 이용하세요.'};
export default function Page(){return <main className="calculatorPage"><header className="calcHeader"><div className="wrap"><Link className="brand" href="/"><span className="brandmark"><TrendingUp size={20}/></span><span>Invest<span>Toolkit</span></span></Link><Link href="/">홈으로</Link></div></header><section className="hubHero"><div className="wrap"><div className="breadcrumb"><Link href="/">홈</Link><ChevronRight/><b>전체 계산기</b></div><span>25 FREE CALCULATORS</span><h1>미국주식과 ETF 계산을<br/>빠르게 시작하세요.</h1><p>환율을 포함한 수익부터 ETF 보수, 배당 목표, 적립매수와 은퇴 준비까지 계산합니다.</p></div></section><section className="wrap hubContent"><CalculatorHub items={calculators}/></section></main>}
