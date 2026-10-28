import {el,numericEditor} from '../../ui/dom.js';
import {pl,tr} from '../../i18n/pl.js';
export function render(i,api){
  const editor=numericEditor(i.remainder?[pl.quotient,pl.remainder]:[pl.quotient],values=>api.submit({quotient:values[0],remainder:values[1]??0}),api.interact);
  return {node:el('div',{className:'game-content'},el('p',{className:'board-prompt'},pl.input),el('div',{className:'big-expression'},`${i.n} ÷ ${i.d}`),editor.node),key:editor.key,reveal:()=>api.notice(tr(pl.solution,{answer:`${i.solution.quotient}${i.remainder?`, ${pl.remainder}: ${i.solution.remainder}`:''}`}))};
}
