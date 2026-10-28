import {el,button} from '../../ui/dom.js';
import {pl,tr} from '../../i18n/pl.js';
export function render(i,api) {
  const count=el('p',{className:'subtle'},tr(pl.selected,{n:0,max:i.find}));
  const board=el('div',{className:'number-grid divisor-grid',style:{'--cols':i.board.length<=16?'4':'5'}});
  i.board.forEach((n,index)=>{
    const cell=button(n,()=>{
      const result=api.submit(index);if(!result || result.ignored)return;
      cell.classList.add(result.correct?'correct':'incorrect');cell.append(el('span',{className:'cell-mark','aria-hidden':'true'},result.correct?'✓':'×'));cell.disabled=true;
      count.textContent=tr(pl.selected,{n:board.querySelectorAll('.correct').length,max:i.find});
    },'cell');board.append(cell);
  });
  return {node:el('div',{className:'game-content'},el('p',{className:'board-prompt'},tr(pl.divisor,{n:i.find})),el('div',{className:'big-target'},i.divisor),count,board),reveal:()=>i.solution.forEach(j=>board.children[j].classList.add('solution'))};
}
