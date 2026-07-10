'use client';
import {useMemo,useState} from 'react';
import {ArrowRight,Bot,Calculator,Info,RotateCcw,Share2,Sparkles,TrendingUp} from 'lucide-react';
import type {CalculatorDef} from '@/lib/calculators';

const won=(n:number)=>`${Math.round(n).toLocaleString('ko-KR')}원`;
const num=(n:number,d=1)=>n.toLocaleString('ko-KR',{maximumFractionDigits:d});
function calculate(slug:string,v:Record<string,number>){
 const m=(v.rate||0)/1200, n=(v.years||0)*12; let main=0,label='계산 결과',items:{label:string;value:string}[]=[];
 if(slug==='compound-interest'){main=v.principal*Math.pow(1+m,n)+v.monthly*(Math.pow(1+m,n)-1)/m;const inv=v.principal+v.monthly*n;label=`${v.years}년 후 예상 자산`;items=[{label:'총 투자원금',value:won(inv)},{label:'예상 수익',value:won(main-inv)}]}
 if(slug==='recurring-investment'){main=v.monthly*(Math.pow(1+m,n)-1)/m;const inv=v.monthly*n;label='예상 최종 자산';items=[{label:'총 납입금',value:won(inv)},{label:'예상 수익',value:won(main-inv)}]}
 if(slug==='dividend-calculator'){const gross=v.principal*v.yield/100;main=gross*(1-v.tax/100);label='연간 세후 배당금';items=[{label:'월평균 배당금',value:won(main/12)},{label:'예상 세금',value:won(gross-main)}]}
 if(slug==='dividend-growth'){main=v.dividend*Math.pow(1+v.growth/100,v.years);label=`${v.years}년 후 연 배당금`;items=[{label:'현재 연 배당금',value:won(v.dividend)},{label:'증가 금액',value:won(main-v.dividend)}]}
 if(slug==='fire-calculator'){main=v.expense*12/(v.withdrawal/100);label='필요한 FIRE 목표 자산';let years=0,a=v.current;while(a<main&&years<100){a=a*(1+v.rate/100)+v.monthly*12;years++}items=[{label:'현재 준비율',value:num(v.current/main*100)+'%'},{label:'예상 도달 기간',value:years>=100?'100년 이상':years+'년'}]}
 if(slug==='target-asset'){const factor=(Math.pow(1+m,n)-1)/m;main=Math.max(0,(v.target-v.current*Math.pow(1+m,n))/factor);label='필요한 월 투자금';items=[{label:'목표 자산',value:won(v.target)},{label:'현재 자산 미래가치',value:won(v.current*Math.pow(1+m,n))}]}
 if(slug==='cagr-calculator'){main=(Math.pow(v.end/v.start,1/v.years)-1)*100;label='연평균 복합 성장률';items=[{label:'총 상승률',value:num((v.end/v.start-1)*100)+'%'},{label:'자산 배수',value:num(v.end/v.start,2)+'배'}]}
 if(slug==='expected-return'){const bearP=100-v.bullP-v.baseP;main=(v.bull*v.bullP+v.base*v.baseP+v.bear*bearP)/100;label='확률 가중 기대수익률';items=[{label:'기대 수익금',value:won(v.principal*main/100)},{label:'하락 확률',value:num(bearP)+'%'}]}
 if(slug==='etf-return'){main=(v.sell-v.buy)*v.quantity+v.dividend*v.quantity;label='ETF 총수익';items=[{label:'총수익률',value:num(main/(v.buy*v.quantity)*100)+'%'},{label:'누적 분배금',value:won(v.dividend*v.quantity)}]}
 if(slug==='etf-dividend'){const total=v.price*v.quantity;main=total*v.yield/100;label='연간 예상 분배금';items=[{label:'회당 분배금',value:won(main/v.frequency)},{label:'총 투자금',value:won(total)}]}
 if(slug==='rebalancing'){const total=v.assetA+v.assetB,target=total*v.targetA/100,diff=target-v.assetA;main=Math.abs(diff);label=diff>=0?'자산 A 추가 매수':'자산 A 매도';items=[{label:'자산 B 조정',value:diff>=0?`${won(diff)} 매도`:`${won(-diff)} 매수`},{label:'전체 자산',value:won(total)}]}
 if(slug==='exchange-rate'){main=v.won/v.rate*(1-v.fee/100);label='예상 수령 달러';items=[{label:'적용 환율',value:num(v.rate)+'원/USD'},{label:'예상 수수료',value:won(v.won*v.fee/100)}]}
 if(slug==='us-dividend-tax'){const net=v.usd*(1-v.tax/100);main=net*v.rate;label='세후 원화 배당금';items=[{label:'세후 달러 배당',value:'$'+num(net,2)},{label:'원천징수세',value:'$'+num(v.usd-net,2)}]}
 if(slug==='average-price'){main=(v.price1*v.qty1+v.price2*v.qty2)/(v.qty1+v.qty2);label='추가 매수 후 평균단가';items=[{label:'총 보유수량',value:num(v.qty1+v.qty2)+'주'},{label:'총 매입금액',value:won(v.price1*v.qty1+v.price2*v.qty2)}]}
 if(slug==='profit-loss'){const buy=v.buy*v.quantity,sell=v.sell*v.quantity,cost=(buy+sell)*v.fee/100;main=sell-buy-cost;label='예상 순손익';items=[{label:'순수익률',value:num(main/buy*100)+'%'},{label:'예상 거래비용',value:won(cost)}]}
 if(slug==='loan'){main=v.principal*m*Math.pow(1+m,n)/(Math.pow(1+m,n)-1);label='월 원리금 상환액';items=[{label:'총 상환액',value:won(main*n)},{label:'총 이자',value:won(main*n-v.principal)}]}
 if(slug==='deposit'){const gross=v.principal*v.rate/100*v.months/12;main=v.principal+gross*(1-v.tax/100);label='세후 만기 수령액';items=[{label:'세전 이자',value:won(gross)},{label:'이자소득세',value:won(gross*v.tax/100)}]}
 if(slug==='savings'){const gross=v.monthly*v.rate/100/12*(v.months*(v.months+1)/2);main=v.monthly*v.months+gross*(1-v.tax/100);label='세후 만기 수령액';items=[{label:'총 납입금',value:won(v.monthly*v.months)},{label:'세후 이자',value:won(gross*(1-v.tax/100))}]}
 if(slug==='severance'){main=v.salary/v.days3m*30*v.serviceDays/365;label='예상 퇴직금';items=[{label:'1일 평균임금',value:won(v.salary/v.days3m)},{label:'환산 근속연수',value:num(v.serviceDays/365,2)+'년'}]}
 if(slug==='pension'){const pm=v.rate/1200,months=v.years*12;main=v.asset*pm/(1-Math.pow(1+pm,-months));label='예상 월 연금';items=[{label:'연간 수령액',value:won(main*12)},{label:'예상 총수령액',value:won(main*months)}]}
 const display=['cagr-calculator','expected-return'].includes(slug)?num(main)+'%':slug==='exchange-rate'?'$'+num(main,2):won(main);
 return {main,label,display,items};
}
export default function CalculatorClient({def}:{def:CalculatorDef}){
 const defaults=Object.fromEntries(def.fields.map(f=>[f.key,f.default])); const [values,setValues]=useState<Record<string,number>>(defaults); const result=useMemo(()=>calculate(def.slug,values),[def.slug,values]);
 return <div className="calcLayout"><section className="calcPanel"><div className="panelTitle"><Calculator/><div><h2>값을 입력하세요</h2><p>조건을 변경하면 결과가 바로 계산됩니다.</p></div><button onClick={()=>setValues(defaults)}><RotateCcw/>초기화</button></div><div className="inputGrid">{def.fields.map(f=><label key={f.key}><span>{f.label}</span><div><input type="number" value={values[f.key]} min={f.min??0} step={f.step??1} onChange={e=>setValues({...values,[f.key]:Number(e.target.value)})}/><b>{f.unit}</b></div></label>)}</div></section><section className="calcResult"><span className="resultLabel">{result.label}</span><strong>{result.display}</strong><div className="resultItems">{result.items.map(x=><div key={x.label}><span>{x.label}</span><b>{x.value}</b></div>)}</div><div className="aiExplain"><Bot/><div><b><Sparkles/> 스마트 분석</b><p>입력한 조건을 기준으로 계산했습니다. 수익률과 기간을 바꿔 결과가 얼마나 달라지는지 비교해 보세요.</p></div></div><div className="resultActions"><button><Share2/>결과 공유</button><button className="save">계산 저장 <ArrowRight/></button></div></section></div>
}

