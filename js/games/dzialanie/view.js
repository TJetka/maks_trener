import {el,button,symbol} from '../../ui/dom.js';
import {pl,tr} from '../../i18n/pl.js';
export function render(i,api) {
  let numbers=i.numbers.map(n=>i.prefill==='numbers'?n:null),operators=i.operators.map(o=>i.prefill==='operators'?o:null),active={type:'number',index:0},tokens=[];
  const expression=el('div',{className:'expression'}),palette=el('div',{className:'palette'}),operatorPalette=el('div',{className:'palette operators'});
  const free=api.settings.freeExpression&&i.prefill==='none';
  function used(n) { return (free?tokens.filter(t=>typeof t==='number'):numbers).filter(x=>x===n).length>=i.palette.filter(x=>x===n).length; }
  function paint() {
    expression.replaceChildren();
    if(free)expression.append(el('span',{},tokens.length?tokens.map(symbol).join(' '):'…'));
    else {
      i.numbers.forEach((_,index)=>{
        if(index===0&&i.brackets)expression.append('(');
        if(index)expression.append(button(symbol(operators[index-1]??'?'),()=>{api.interact();active={type:'operator',index:index-1};paint();},`slot operator ${active.type==='operator'&&active.index===index-1?'active':''}`,{'aria-label':tr(pl.operatorSlot,{n:index}),disabled:i.prefill==='operators'}));
        expression.append(button(numbers[index]??'?',()=>{api.interact();if(i.prefill!=='numbers')numbers[index]=null;active={type:'number',index};paint();},`slot ${active.type==='number'&&active.index===index?'active':''}`,{'aria-label':tr(pl.numberSlot,{n:index+1}),disabled:i.prefill==='numbers'}));
        if(index===1&&i.brackets)expression.append(')');
      });
    }
    palette.replaceChildren(...i.palette.map(n=>button(n,()=>{
      api.interact();if(free)tokens.push(n);else {const index=active.type==='number'?active.index:numbers.indexOf(null);if(index>=0)numbers[index]=n;active={type:'number',index:Math.max(0,numbers.indexOf(null))};}paint();
    },'token',{disabled:used(n)||i.prefill==='numbers'})));
    operatorPalette.replaceChildren(...[...i.allowed,...(free&&i.brackets?['(',')']:[])].map(op=>button(symbol(op),()=>{
      api.interact();if(free)tokens.push(op);else{const index=active.type==='operator'?active.index:operators.indexOf(null);if(index>=0)operators[index]=op;active={type:'operator',index:Math.max(0,operators.indexOf(null))};}paint();
    },'token operator',{disabled:i.prefill==='operators'})));
  }
  function submit(){if(free){if(!tokens.length)return;api.submit({tokens:[...tokens]});}else if(numbers.every(n=>n!==null)&&operators.every(n=>n!==null))api.submit({numbers:[...numbers],operators:[...operators]});else api.notice(pl.emptyAnswer);}
  function undo(){api.interact();if(free)tokens.pop();else{if(i.prefill!=='numbers')numbers=numbers.map(()=>null);if(i.prefill!=='operators')operators=operators.map(()=>null);}paint();}
  paint();
  return {node:el('div',{className:'game-content'},el('p',{className:'board-prompt'},pl.expression),el('div',{className:'target-label'},pl.target),el('div',{className:'big-target'},i.target),expression,free?el('p',{className:'subtle'},pl.freeHint):null,palette,operatorPalette,el('div',{className:'actions'},button(pl.undo,undo,'button secondary'),button(pl.confirm,submit))),key:key=>{if(key==='Enter'){submit();return true;}if(key==='Backspace'){undo();return true;}return false;},reveal:()=>api.notice(tr(pl.solution,{answer:i.numbers.map((n,j)=>`${j?` ${symbol(i.operators[j-1])} `:''}${n}`).join('')}))};
}
