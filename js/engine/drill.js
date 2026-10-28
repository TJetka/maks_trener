import {mulberry32,int,pick} from './rng.js';
import {Clock} from './clock.js';
import {facts,emptySummary,addEvent} from './stats.js';
import {APP_VERSION} from './run.js';
const DIVISORS=[2,3,4,5,6,9,10];
export function weightedPick(rng,items,weight) {
  const weights=items.map(weight); let remaining=rng()*weights.reduce((a,b)=>a+b,0);
  for (let i=0;i<items.length;i++) { remaining-=weights[i]; if (remaining<=0) return items[i]; }
  return items.at(-1);
}
export function drillItems(type,runs,seed,max=10,focus=null) {
  const rng=mulberry32(seed),weak=facts(runs), lookup=new Map(weak.map(f=>[f.signature,f]));
  const weight=signature=>{ const f=lookup.get(signature); return (1+(f?.errors??0))*Math.max(1,(f?.medianMs??2000)/2000)*(signature===focus?8:1); };
  return Array.from({length:20},()=>{
    if (type==='facts') {
      const pool=Array.from({length:max*max},(_,j)=>[Math.floor(j/max)+1,j%max+1]);
      const [a,b]=weightedPick(rng,pool,([a,b])=>weight(`mul:${a}x${b}`)+weight(`div:${a}x${b}`));
      const division=rng()<.4;
      return {kind:'number',prompt:division?`${a*b} : ${a} = ?`:`${a} × ${b} = ?`,solution:division?b:a*b,itemSignature:`${division?'div':'mul'}:${a}x${b}`};
    }
    if (type==='divisibility') {
      const d=weightedPick(rng,DIVISORS,d=>1+weak.filter(f=>f.signature.startsWith(`div${d}:`)).reduce((n,f)=>n+f.errors/f.count,0));
      const n=int(rng,2,Math.floor(200/d))*d+(rng()<.2?1:0);
      return {kind:'divisors',n,divisors:DIVISORS,solution:DIVISORS.filter(d=>n%d===0),itemSignature:`div${d}:${n}`};
    }
    const a=int(rng,2,max),b=int(rng,2,max),operator=pick(rng,['+','-','*']);
    if (rng()<.5) return {kind:'operator',prompt:`${a} ? ${b} = ${operator==='+'?a+b:operator==='-'?a-b:a*b}`,solution:operator,options:['+','-','*'],itemSignature:'target:operator'};
    return {kind:'number',prompt:`${a} × ? = ${a*b}`,solution:b,itemSignature:`mul:${a}x${b}`};
  });
}
export function checkDrill(item,answer) {
  if (item.kind==='divisors') return Array.isArray(answer)&&answer.length===item.solution.length&&new Set(answer).size===answer.length&&answer.every(d=>item.solution.includes(d));
  return answer===item.solution;
}
export class Drill {
  constructor(type,runs,seed,{now,wallNow=()=>Date.now(),max=10,focus=null}={}) {
    Object.assign(this,{type,seed,wallNow}); this.items=drillItems(type,runs,seed,max,focus); this.index=0; this.events=[]; this.summary=emptySummary(); this.clock=new Clock(now);this.startedAt=wallNow();this.clock.start();this.last=0;
  }
  answer(answer) {
    if (this.index>=20) return null;
    const item=this.items[this.index],t=this.clock.elapsed(),correct=checkDrill(item,answer);
    const event={t,level:this.index+1,correct,responseMs:t-this.last,itemSignature:item.itemSignature,answer};
    this.events.push(event);addEvent(this.summary,event);this.index++;this.last=t;
    return {correct,item,done:this.index===20};
  }
  next() { this.last=this.clock.elapsed(); }
  record() {
    return {id:`d_${this.startedAt}_${this.seed}`,gameId:'drill',variantId:`drill:${this.type}`,mode:'drill',sessionId:null,seed:this.seed,startedAt:this.startedAt,durationMs:this.clock.elapsed(),score:this.summary.correct,levelsReached:this.index,strikes:0,endReason:'levels',events:this.events,summary:this.summary,provenance:{appVersion:APP_VERSION,seed:this.seed}};
  }
}
