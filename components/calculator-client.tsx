'use client';
import {useEffect,useMemo,useState} from 'react';
import {ArrowRight,Bot,Calculator,Info,RotateCcw,Share2,Sparkles,TrendingUp} from 'lucide-react';
import type {CalculatorDef} from '@/lib/calculators';

const won=(n:number)=>`${Math.round(n).toLocaleString('ko-KR')}원`;
const num=(n:number,d=1)=>n.toLocaleString('ko-KR',{maximumFractionDigits:d});
const futureFactor=(rate:number,months:number)=>rate===0?months:(Math.pow(1+rate,months)-1)/rate;
const koreanAmount=(n:number)=>{const a=Math.abs(n);if(a>=100_000_000)return `${num(n/100_000_000,2)}억원`;if(a>=10_000)return `${num(n/10_000,1)}만원`;return `${num(n)}원`};
function insight(slug:string,v:Record<string,number>,r:{main:number;items:{label:string;value:string}[]}){const map:Record<string,string>={
 'compound-interest':`투자 기간이 길어질수록 예상 수익이 총자산에서 차지하는 비중이 커집니다. 수익률을 보수적으로 바꿔 결과 차이를 확인하세요.`,
 'recurring-investment':`월 투자금과 투자 기간이 결과에 가장 큰 영향을 줍니다. 감당 가능한 금액으로 장기간 유지하는 계획이 중요합니다.`,
 'dividend-calculator':`세후 월평균 배당과 실제 지급 주기는 다를 수 있습니다. 종목별 배당 일정과 감액 가능성도 함께 확인하세요.`,
 'fire-calculator':`현재 자산은 목표 FIRE 자산의 ${num(v.current/Math.max(r.main,1)*100)}%입니다. 생활비와 안전 인출률을 보수적으로 설정해 보세요.`,
 'loan':`월 상환액뿐 아니라 총이자와 중도상환 조건을 함께 비교해야 합니다. 실제 금융기관의 상환 방식에 따라 금액이 달라질 수 있습니다.`,
 'average-price':`추가 매수는 평균단가를 낮출 수 있지만 전체 투자금과 특정 자산의 비중도 함께 증가시킵니다.`,
 'pension':`예상 월 연금은 물가상승을 반영하지 않은 금액입니다. 은퇴 시점의 실질 구매력을 별도로 고려하세요.`,
 } ;return map[slug]||`입력한 조건을 기준으로 계산한 간이 예상값입니다. 주요 조건을 바꾸며 보수적·기준·낙관 결과를 비교해 보세요.`}
export function calculate(slug:string,v:Record<string,number>){
 const m=(v.rate||0)/1200, n=(v.years||0)*12; let main=0,label='계산 결과',items:{label:string;value:string}[]=[];
 if(slug==='compound-interest'){main=v.principal*Math.pow(1+m,n)+v.monthly*futureFactor(m,n);const inv=v.principal+v.monthly*n;label=`${v.years}년 후 예상 자산`;items=[{label:'총 투자원금',value:won(inv)},{label:'예상 수익',value:won(main-inv)}]}
 if(slug==='recurring-investment'){main=v.monthly*futureFactor(m,n);const inv=v.monthly*n;label='예상 최종 자산';items=[{label:'총 납입금',value:won(inv)},{label:'예상 수익',value:won(main-inv)}]}
 if(slug==='dividend-calculator'){const gross=v.principal*v.yield/100;main=gross*(1-v.tax/100);label='연간 세후 배당금';items=[{label:'월평균 배당금',value:won(main/12)},{label:'예상 세금',value:won(gross-main)}]}
 if(slug==='dividend-growth'){main=v.dividend*Math.pow(1+v.growth/100,v.years);label=`${v.years}년 후 연 배당금`;items=[{label:'현재 연 배당금',value:won(v.dividend)},{label:'증가 금액',value:won(main-v.dividend)}]}
 if(slug==='fire-calculator'){main=v.expense*12/(v.withdrawal/100);label='필요한 FIRE 목표 자산';let years=0,a=v.current;while(a<main&&years<100){a=a*(1+v.rate/100)+v.monthly*12;years++}items=[{label:'현재 준비율',value:num(v.current/main*100)+'%'},{label:'예상 도달 기간',value:years>=100?'100년 이상':years+'년'}]}
 if(slug==='target-asset'){const factor=futureFactor(m,n);main=Math.max(0,(v.target-v.current*Math.pow(1+m,n))/Math.max(factor,1));label='필요한 월 투자금';items=[{label:'목표 자산',value:won(v.target)},{label:'현재 자산 미래가치',value:won(v.current*Math.pow(1+m,n))}]}
 if(slug==='cagr-calculator'){main=(Math.pow(v.end/v.start,1/v.years)-1)*100;label='연평균 복합 성장률';items=[{label:'총 상승률',value:num((v.end/v.start-1)*100)+'%'},{label:'자산 배수',value:num(v.end/v.start,2)+'배'}]}
 if(slug==='expected-return'){const bearP=100-v.bullP-v.baseP;main=(v.bull*v.bullP+v.base*v.baseP+v.bear*bearP)/100;label='확률 가중 기대수익률';items=[{label:'기대 수익금',value:won(v.principal*main/100)},{label:'하락 확률',value:num(bearP)+'%'}]}
 if(slug==='etf-return'){main=(v.sell-v.buy)*v.quantity+v.dividend*v.quantity;label='ETF 총수익';items=[{label:'총수익률',value:num(main/(v.buy*v.quantity)*100)+'%'},{label:'누적 분배금',value:won(v.dividend*v.quantity)}]}
 if(slug==='etf-dividend'){const total=v.price*v.quantity;main=total*v.yield/100;label='연간 예상 분배금';items=[{label:'회당 분배금',value:won(main/v.frequency)},{label:'총 투자금',value:won(total)}]}
 if(slug==='rebalancing'){const total=v.assetA+v.assetB,target=total*v.targetA/100,diff=target-v.assetA;main=Math.abs(diff);label=diff>=0?'자산 A 추가 매수':'자산 A 매도';items=[{label:'자산 B 조정',value:diff>=0?`${won(diff)} 매도`:`${won(-diff)} 매수`},{label:'전체 자산',value:won(total)}]}
 if(slug==='exchange-rate'){main=v.won/v.rate*(1-v.fee/100);label='예상 수령 달러';items=[{label:'적용 환율',value:num(v.rate)+'원/USD'},{label:'예상 수수료',value:won(v.won*v.fee/100)}]}
 if(slug==='us-dividend-tax'){const net=v.usd*(1-v.tax/100);main=net*v.rate;label='세후 원화 배당금';items=[{label:'세후 달러 배당',value:'$'+num(net,2)},{label:'원천징수세',value:'$'+num(v.usd-net,2)}]}
 if(slug==='average-price'){main=(v.price1*v.qty1+v.price2*v.qty2)/(v.qty1+v.qty2);label='추가 매수 후 평균단가';items=[{label:'총 보유수량',value:num(v.qty1+v.qty2)+'주'},{label:'총 매입금액',value:won(v.price1*v.qty1+v.price2*v.qty2)}]}
 if(slug==='profit-loss'){const buy=v.buy*v.quantity,sell=v.sell*v.quantity,cost=(buy+sell)*v.fee/100;main=sell-buy-cost;label='예상 순손익';items=[{label:'순수익률',value:num(main/buy*100)+'%'},{label:'예상 거래비용',value:won(cost)}]}
 if(slug==='loan'){main=m===0?v.principal/n:v.principal*m*Math.pow(1+m,n)/(Math.pow(1+m,n)-1);label='월 원리금 상환액';items=[{label:'총 상환액',value:won(main*n)},{label:'총 이자',value:won(main*n-v.principal)}]}
 if(slug==='deposit'){const gross=v.principal*v.rate/100*v.months/12;main=v.principal+gross*(1-v.tax/100);label='세후 만기 수령액';items=[{label:'세전 이자',value:won(gross)},{label:'이자소득세',value:won(gross*v.tax/100)}]}
 if(slug==='savings'){const gross=v.monthly*v.rate/100/12*(v.months*(v.months+1)/2);main=v.monthly*v.months+gross*(1-v.tax/100);label='세후 만기 수령액';items=[{label:'총 납입금',value:won(v.monthly*v.months)},{label:'세후 이자',value:won(gross*(1-v.tax/100))}]}
 if(slug==='severance'){main=v.salary/v.days3m*30*v.serviceDays/365;label='예상 퇴직금';items=[{label:'1일 평균임금',value:won(v.salary/v.days3m)},{label:'환산 근속연수',value:num(v.serviceDays/365,2)+'년'}]}
 if(slug==='pension'){const pm=v.rate/1200,months=v.years*12;main=pm===0?v.asset/months:v.asset*pm/(1-Math.pow(1+pm,-months));label='예상 월 연금';items=[{label:'연간 수령액',value:won(main*12)},{label:'예상 총수령액',value:won(main*months)}]}
 const display=['cagr-calculator','expected-return'].includes(slug)?num(main)+'%':slug==='exchange-rate'?'$'+num(main,2):won(main);
 return {main,label,display,items};
}
export default function CalculatorClient({def}:{def:CalculatorDef}){
 const defaults=Object.fromEntries(def.fields.map(f=>[f.key,f.default])); const [values,setValues]=useState<Record<string,number>>(defaults); const [message,setMessage]=useState(''); const result=useMemo(()=>calculate(def.slug,values),[def.slug,values]);
 const scenarios=useMemo(()=>{if(!('rate' in values))return[];return[-1,0,1].map(delta=>{const rate=Math.max(-99,values.rate+delta);const r=calculate(def.slug,{...values,rate});return{label:delta<0?'보수적':delta>0?'낙관적':'기준',rate,value:r.main,display:r.display}})},[def.slug,values]);
 useEffect(()=>{const q=new URLSearchParams(window.location.search);const shared=Object.fromEntries(def.fields.filter(f=>q.has(f.key)).map(f=>[f.key,Number(q.get(f.key))]));if(Object.keys(shared).length)setValues({...defaults,...shared});},[]);
 const flash=(text:string)=>{setMessage(text);window.setTimeout(()=>setMessage(''),2200)};
 const share=async()=>{const q=new URLSearchParams(Object.entries(values).map(([k,v])=>[k,String(v)]));const url=`${window.location.origin}${window.location.pathname}?${q}`;if(navigator.share)await navigator.share({title:def.name,text:`${def.name} 계산 결과: ${result.display}`,url});else{await navigator.clipboard.writeText(url);flash('공유 링크를 복사했습니다.')}};
 const save=()=>{localStorage.setItem(`investtoolkit:${def.slug}`,JSON.stringify({values,result:result.display,savedAt:new Date().toISOString()}));flash('이 브라우저에 계산 결과를 저장했습니다.')};
 return <><div className="calcLayout"><section className="calcPanel"><div className="panelTitle"><Calculator/><div><h2>값을 입력하세요</h2><p>조건을 변경하면 결과가 바로 계산됩니다.</p></div><button onClick={()=>setValues(defaults)}><RotateCcw/>초기화</button></div><div className="inputGrid">{def.fields.map(f=><label key={f.key}><span>{f.label}</span><div><input type="number" value={values[f.key]} min={f.min??(f.default<0?-100:0)} step={f.step??1} onChange={e=>{const n=Number(e.target.value);setValues({...values,[f.key]:Number.isFinite(n)?n:0})}}/><b>{f.unit}</b></div>{f.unit==='원'&&<small className="amountHint">{koreanAmount(values[f.key])}</small>}</label>)}</div></section><section className="calcResult"><span className="resultLabel">{result.label}</span><strong>{result.display}</strong><div className="resultItems">{result.items.map(x=><div key={x.label}><span>{x.label}</span><b>{x.value}</b></div>)}</div>{scenarios.length>0&&<div className="scenarioMini"><div className="scenarioTitle"><span>수익률 시나리오 비교</span><small>기준 ±1%p</small></div>{scenarios.map(s=>{const max=Math.max(...scenarios.map(x=>Math.abs(x.value)),1);return <div className="scenarioRow" key={s.label}><span>{s.label}<small>{s.rate}%</small></span><i><b style={{width:`${Math.max(8,Math.abs(s.value)/max*100)}%`}}/></i><strong>{s.display}</strong></div>})}</div>}<div className="aiExplain"><TrendingUp/><div><b><Sparkles/> 결과 해석</b><p>{insight(def.slug,values,result)}</p></div></div><div className="resultActions"><button onClick={share}><Share2/>결과 공유</button><button className="save" onClick={save}>계산 저장 <ArrowRight/></button></div></section></div>{message&&<div className="calcToast">{message}</div>}</>
}
