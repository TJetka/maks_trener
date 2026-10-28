import {el,button,keypad,symbol} from '../../ui/dom.js';
import {pl,tr} from '../../i18n/pl.js';
export function render(i,api){
  const values=i.blanks.map(()=>null),cells=[];let active=0;
  function paint(){cells.forEach((c,j)=>{c.textContent=values[j]??'?';c.classList.toggle('active',active===j);});}
  function submit(){if(values.every(v=>v!==null))api.submit([...values]);else api.notice(pl.emptyAnswer);}
  function key(k){api.interact();if(/^\d$/.test(k)){values[active]=Number(k);active=(active+1)%values.length;}else if(k==='Backspace'){active=(active+values.length-1)%values.length;values[active]=null;}else if(k==='Enter')submit();else return false;paint();return true;}
  const width=Math.max(...i.rows.map(r=>r.length));
  const board=el('div',{className:'column-board'},i.rows.map((row,r)=>el('div',{className:`column-row ${r===2?'result':''}`,style:{'--cols':width+1}},el('span',{},r===1?symbol({add:'+',subtract:'-',multiply:'*'}[i.operation]):''),Array.from({length:width-row.length},()=>el('span')),row.map((digit,c)=>{
    if(digit!==null)return el('span',{},digit);const j=i.blanks.findIndex(([br,bc])=>br===r&&bc===c);const node=button('?',()=>{api.interact();active=j;paint();},'slot',{'aria-label':tr(pl.blank,{n:j+1})});cells[j]=node;return node;
  }))));paint();
  return {node:el('div',{className:'game-content'},el('p',{className:'board-prompt'},pl.column),board,keypad(key)),key,reveal:()=>{i.solution.forEach((n,j)=>{cells[j].textContent=n;cells[j].classList.add('solution');});}};
}
