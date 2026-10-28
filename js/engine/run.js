import {Clock} from './clock.js';
import {mulberry32} from './rng.js';
import {createScore,scoreAnswer,finish} from './scoring.js';
import {games,parameters} from '../games/registry.js';
import {emptySummary,addEvent} from './stats.js';
export const APP_VERSION = '1.0.0';
/** Own one run; rendering and storage live outside this controller. All times are ms. */
export class Run {
  constructor({gameId,seed,mode='free',settings={},overrides={},variantId,sessionId=null,now,wallNow=()=>Date.now(),sessionRemaining=()=>Infinity,readingMs=null}) {
    Object.assign(this,{gameId,seed,mode,settings,overrides,sessionId,wallNow,sessionRemaining,readingMs});
    this.game=games[gameId]; this.rng=mulberry32(seed); this.clock=new Clock(now);
    this.variantId=variantId ?? `${gameId}:preset`; this.startedAt=null;
    this.state=createScore(parameters(gameId,1,settings,overrides));
    this.events=[]; this.summary=emptySummary(); this.visibilityEvents=[]; this.levelStarted=0; this.lastResponse=0; this.lastAction=-Infinity; this.firstCorrectMs=null; this.peak=0; this.peakAt=null;
    this.next();
  }
  next() {
    const previousDivisor=this.instance?.divisor;
    this.params=parameters(this.gameId,this.state.level,this.settings,this.overrides);
    this.instance=this.game.generate(this.state.level,{...this.params,previousDivisor},this.rng);
    this.selected=new Set(); this.marked=new Set();
    this.levelStarted=this.clock.elapsed(); this.lastResponse=this.levelStarted;
  }
  start() { if (this.startedAt===null) { this.startedAt=this.wallNow(); this.clock.start(); } }
  remaining() {
    const elapsed=this.state.config.archetype==='ladder' ? this.clock.elapsed() : this.clock.elapsed()-this.levelStarted;
    return Math.max(0,Math.min(this.state.config.seconds*1000-elapsed,this.sessionRemaining()));
  }
  tick() {
    if (this.state.ended) return;
    if (this.sessionRemaining()<=0) this.end('session');
    else if (this.startedAt!==null && this.remaining()<=0) this.end('timeout');
  }
  interact() { this.tick(); if (this.state.ended) return false; this.start(); return true; }
  answer(answer) {
    if (!this.interact()) return {ignored:true};
    const elapsed=this.clock.elapsed();
    if (elapsed-this.lastAction<150) return {ignored:true};
    if (this.gameId==='dzielnik' && this.marked.has(answer)) return {ignored:true};
    this.lastAction=elapsed;
    const {correct}=this.game.check(this.instance,answer);
    let complete=correct;
    if (this.gameId==='dzielnik') {
      this.marked.add(answer); if (correct) this.selected.add(answer);
      complete=this.selected.size>=this.instance.find;
    }
    const signature=this.gameId==='dzielnik' ? `div${this.instance.divisor}:${this.instance.board[answer]}` : this.instance.itemSignature;
    const event={t:elapsed,level:this.state.level,correct,responseMs:elapsed-this.lastResponse,itemSignature:signature,answer:structuredClone(answer)};
    this.lastResponse=elapsed; this.events.push(event); if (this.events.length>400) this.events.shift(); addEvent(this.summary,event);
    if (correct && this.firstCorrectMs===null) this.firstCorrectMs=elapsed;
    const before=this.state.score; this.state=scoreAnswer(this.state,correct,complete);
    if (this.state.score>this.peak) { this.peak=this.state.score; this.peakAt=this.wallNow(); }
    if (this.state.ended) this.end(this.state.endReason);
    return {correct,complete,delta:this.state.score-before,next:correct && complete || !correct && this.state.config.archetype==='ladder'};
  }
  visibility(hidden) {
    if (this.mode==='session') this.visibilityEvents.push({t:this.clock.elapsed(),hidden});
    else if (hidden) this.clock.pause(); else this.clock.resume();
  }
  end(reason) {
    if (this.endedAt!==undefined) return;
    this.state=finish(this.state,reason); this.endedAt=this.wallNow(); this.durationMs=this.clock.elapsed(); this.clock.pause();
  }
  record() {
    if (!this.state.ended) throw new Error('Run must end before recording');
    return {id:`r_${this.startedAt ?? this.endedAt}_${this.seed}`,gameId:this.gameId,variantId:this.variantId,mode:this.mode,sessionId:this.sessionId,seed:this.seed,startedAt:this.startedAt ?? this.endedAt,durationMs:this.durationMs,score:this.state.score,levelsReached:this.state.cleared,strikes:this.state.strikes,endReason:this.state.endReason,events:this.events,summary:this.summary,visibilityEvents:this.visibilityEvents,bestAt:this.peakAt,readingMs:this.readingMs,firstCorrectMs:this.firstCorrectMs,provenance:{appVersion:APP_VERSION,generatorVersion:1,seed:this.seed,settings:{...this.settings},overrides:{...this.overrides}}};
  }
}
