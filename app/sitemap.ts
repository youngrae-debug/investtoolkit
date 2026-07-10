import type {MetadataRoute} from 'next';import {calculators} from '@/lib/calculators';
export default function sitemap():MetadataRoute.Sitemap{const base='https://investtoolkit.kr';return[{url:base,lastModified:new Date(),priority:1},...calculators.map(c=>({url:`${base}/calculators/${c.slug}`,lastModified:new Date(),changeFrequency:'monthly' as const,priority:.8}))]}

