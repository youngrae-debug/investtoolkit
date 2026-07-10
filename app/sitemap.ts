import type {MetadataRoute} from 'next';import {calculators} from '@/lib/calculators';
export const dynamic='force-static';
export default function sitemap():MetadataRoute.Sitemap{const base='https://invetk.com';return[{url:base,lastModified:new Date(),priority:1},{url:`${base}/calculators`,lastModified:new Date(),priority:.9},...calculators.map(c=>({url:`${base}/calculators/${c.slug}`,lastModified:new Date(),changeFrequency:'monthly' as const,priority:.8}))]}
