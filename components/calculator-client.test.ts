import {describe,expect,it} from 'vitest';
import {calculate} from './calculator-client';
describe('financial calculator formulas',()=>{
 it('calculates CAGR',()=>expect(calculate('cagr-calculator',{start:100,end:200,years:10}).main).toBeCloseTo(7.177,2));
 it('calculates after-tax dividend',()=>expect(calculate('dividend-calculator',{principal:100_000_000,yield:4,tax:15.4}).main).toBe(3_384_000));
 it('calculates a new average price',()=>expect(calculate('average-price',{price1:50_000,qty1:100,price2:40_000,qty2:50}).main).toBeCloseTo(46_666.67,1));
 it('calculates deposit maturity amount',()=>expect(calculate('deposit',{principal:50_000_000,rate:3.5,months:12,tax:15.4}).main).toBe(51_480_500));
 it('calculates severance estimate',()=>expect(calculate('severance',{salary:12_000_000,days3m:92,serviceDays:1825}).main).toBeCloseTo(19_565_217.39,0));
 it('never returns a negative required monthly target contribution',()=>expect(calculate('target-asset',{target:100_000_000,current:200_000_000,rate:7,years:10}).main).toBe(0));
 it('supports a zero percent compound return',()=>expect(calculate('compound-interest',{principal:10_000_000,monthly:500_000,rate:0,years:10}).main).toBe(70_000_000));
 it('supports a zero percent loan rate',()=>expect(calculate('loan',{principal:120_000_000,rate:0,years:10}).main).toBe(1_000_000));
 it('supports a zero percent pension return',()=>expect(calculate('pension',{asset:240_000_000,rate:0,years:20}).main).toBe(1_000_000));
 it('applies dividend payment frequency without changing annual total',()=>expect(calculate('dividend-calculator',{principal:100_000_000,yield:4,tax:15.4,frequency:12,growth:0,years:10}).main).toBe(3_384_000));
 it('subtracts retirement income from FIRE expenses',()=>expect(calculate('fire-calculator',{age:35,expense:3_000_000,otherIncome:1_000_000,withdrawal:4,current:0,monthly:1_000_000,rate:5,inflation:2}).main).toBe(600_000_000));
 it('calculates interest-only loan payments',()=>expect(calculate('loan',{principal:300_000_000,rate:4,years:30,repayment:2,grace:0}).main).toBeCloseTo(1_000_000,0));
 it('includes FX in US stock total return',()=>expect(calculate('us-stock-total-return',{buy:100,sell:100,quantity:10,buyFx:1300,sellFx:1400,dividend:0}).main).toBe(100_000));
 it('calculates required capital for a dividend goal',()=>expect(calculate('dividend-income-goal',{monthlyGoal:1_000_000,yield:4,tax:15,growth:0,years:10}).main).toBeCloseTo(352_941_176,0));
 it('calculates long-term ETF fee impact',()=>expect(calculate('etf-expense-ratio',{principal:10_000_000,monthly:0,rate:8,expense:.1,years:10}).main).toBeGreaterThan(20_000_000));
});
