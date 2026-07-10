'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,Calculator,Search,Star} from 'lucide-react';
import type {CalculatorDef} from '@/lib/calculators';
const categories=['전체','투자','ETF','미국주식','금융'];
export default function CalculatorHub({items}:{items:CalculatorDef[]}){const [query,setQuery]=useState('');const [category,setCategory]=useState('전체');const filtered=useMemo(()=>items.filter(x=>(category==='전체'||x.category===category)&&(`${x.name} ${x.description}`.toLowerCase().includes(query.toLowerCase()))),[items,query,category]);return <><div className="hubControls"><div className="hubSearch"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="계산기 이름이나 목적을 검색하세요"/><kbd>{filtered.length}개</kbd></div><div className="hubFilters">{categories.map(x=><button className={category===x?'active':''} onClick={()=>setCategory(x)} key={x}>{x}</button>)}</div></div><div className="hubGrid">{filtered.map((x,i)=><Link href={`/calculators/${x.slug}`} key={x.slug}><span className="hubIcon"><Calculator/></span>{i<3&&category==='전체'&&<em><Star/>인기</em>}<small>{x.category}</small><h2>{x.name}</h2><p>{x.description}</p><b>계산하기 <ArrowRight/></b></Link>)}</div>{!filtered.length&&<div className="hubEmpty"><Search/><b>검색 결과가 없습니다.</b><p>다른 검색어나 카테고리를 선택해 보세요.</p></div>}</>}

