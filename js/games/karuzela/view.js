import {el,button,symbol} from '../../ui/dom.js';
import {pl} from '../../i18n/pl.js';
export function render(i,api){
  const steps=i.steps.map((s,j)=>el('span',{className:'chain-step'},i.timedReveal?'…':`${symbol(s.op)} ${s.n}`));
  const options=el('div',{className:'ring-options'},i.options.map(n=>button(n,()=>api.submit(n),'cell')));
  return {node:el('div',{className:'game-content'},el('p',{className:'board-prompt'},pl.chain),i.timedReveal?button(pl.readStart,event=>{api.interact();event.currentTarget.hidden=true;},'button secondary'):null,el('div',{className:'chain'},el('strong',{},i.start),...steps.flatMap(s=>[el('span',{className:'chain-arrow'},'→'),s]),el('span',{},'= ?')),options),update:elapsed=>{if(i.timedReveal)steps.forEach((node,j)=>{node.textContent=elapsed>=j*800?`${symbol(i.steps[j].op)} ${i.steps[j].n}`:'…';});},reveal:()=>{[...options.children].find(n=>n.textContent===String(i.solution))?.classList.add('solution');}};
}
