// ===== 操作 =====
const A = {
  home(){ go("home"); },
  handOk(){ S.hand.next(); },
  // ①
  itoSetup(){ newIto(S.ito?S.ito.per:2); go("itoSetup"); },
  itoPer(d){ S.ito.per=+d.n; render(); },
  itoStart(){ deal(); handoff(0, ()=>{ S.memoP=0; go("itoMemo"); }); },
  itoMemoDone(){ const p=S.memoP;
    if(p===0) handoff(1, ()=>{ S.memoP=1; go("itoMemo"); }); else go("itoField"); },
  itoLens(){ drawLens(); render(); },
  itoPeekGo(d){ const p=+d.p; S.ito.peeks[p]--; handoff(p, ()=>{ S.memoP=p; go("itoPeek"); }); },
  itoField(){ go("itoField"); },
  itoOrder(){ go("itoOrder"); },
  itoPut(d){ S.ito.order.push(+d.id); render(); },
  itoUndo(){ S.ito.order.pop(); render(); },
  itoReveal(){ S.ito.revealed=0; go("itoReveal"); },
  itoFlip(){ const it=S.ito; it.revealed++;
    if(it.revealed>=it.order.length){ const nums=it.order.map(id=>it.cards[id].num), ok=nums.every((v,i)=>!i||v>nums[i-1]);
      (S.itoLog=S.itoLog||[]).push({ok, n:nums.length}); recIto(ok, it.per, nums.length); render(); if(ok) confetti(); return; }
    render(); },
  itoAgain(d){ if(d && d.n) S.ito.per=+d.n; deal(); handoff(0, ()=>{ S.memoP=0; go("itoMemo"); }); },
  // ②
  mSetup(){ S.mRounds=S.mRounds||3; S.mMode=S.mMode||"hint"; go("mSetup"); },
  mMode(d){ S.mMode=d.k; render(); },
  mRounds(d){ S.mRounds=+d.n; render(); },
  mStart(){ S.m={mode:S.mMode||"hint", rounds:S.mRounds||3, r:0, score:0, log:[], pairs:shuffle(METER_PAIRS)}; mBeginRound(); },
  mHint(d){ const h=S.m.hints, i=h.indexOf(d.h);
    if(i>=0) h[i]=""; else if(!h[0]) h[0]=d.h; else h[1]=d.h; render(); },
  mPass(){ const m=S.m; if(!m.hints[0] && m.hints[1]) m.hints=[m.hints[1],""]; if(!m.hints[0]) return;
    handoff(taker(), ()=>go("mGuess")); },
  mHonneDone(){ handoff(taker(), ()=>go("mGuess")); },
  mHint2(){ S.m.used2=true; render(); },
  mDecide(){ const m=S.m; let pt=points(Math.abs(m.guess-m.target)); if(m.used2) pt=Math.min(pt,2);
    m.last=pt; m.score+=pt;
    m.log.push({lo:m.pair.lo, hi:m.pair.hi, honne:m.mode==="honne", q:m.mode==="honne"?m.item:(m.hints[0]+(m.used2?"＋"+m.hints[1]:"")), giver:giver(), taker:taker(), target:m.target, guess:m.guess, d:Math.abs(m.guess-m.target), pts:pt});
    go("mReveal");
    // 針が予想位置から正解へ動く演出
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ const rv=document.getElementById("rv"); if(!rv) return;
      rv.querySelector(".mk.target").style.left=m.target+"%"; rv.classList.add("shown"); })); },
  mNext(){ const m=S.m; m.r++; if(m.r>=m.rounds){ recMeter(m); go("mResult"); if(m.score/(m.rounds*3)>=.5) confetti(); return; } mBeginRound(); },
  // ③
  wSetup(){ S.wRounds=S.wRounds||5; S.wMode=S.wMode||"w3"; go("wSetup"); },
  wMode(d){ S.wMode=d.k; render(); },
  wRounds(d){ S.wRounds=+d.n; render(); },
  wStart(){ const mode=S.wMode||"w3", n=S.wRounds||5;
    S.w={mode, rounds:n, r:0, score:0, log:[], deck: mode==="guess"?shuffle(TARGETS).slice(0,n):wBuildDeck(mode,n)}; wBeginRound(); },
  wCount(){ go("wCount"); const seq=["2","1","せーの！"];
    seq.forEach((s,i)=>TIMERS.push(setTimeout(()=>{ const el=document.getElementById("cnt"); if(!el) return;
      el.textContent=s; el.style.fontSize = s.length>1 ? "64px" : ""; el.style.animation="none"; void el.offsetWidth; el.style.animation=""; }, 900*(i+1))));
    TIMERS.push(setTimeout(()=>go("wJudge"), 900*4)); },
  wHit(){ const w=S.w; w.last=1; w.score++; w.log.push({words:w.cur.words, ans:w.cur.ans, hit:true}); go("wAfter"); confetti(); },
  wMiss(){ const w=S.w; w.last=0; w.log.push({words:w.cur.words, ans:w.cur.ans, hit:false}); go("wAfter"); },
  wShowAns(){ S.w.showAns=true; render(); },
  wNext(){ const w=S.w; w.r++; if(w.r>=w.rounds){ recWords(w); go("wResult"); if(w.score/(w.mode==="guess"?w.rounds*5:w.rounds)>=.5) confetti(); return; } wBeginRound(); },
  gUseCard(){ S.w.own=""; go("wBoard"); },
  gUseOwn(){ if(S.w.own) go("wBoard"); },
  gOther(){ const w=S.w; w.t=pickOther(TARGETS, w.t); render(); },
  gNextHint(){ S.w.h++; render(); },
  gAsk(){ if(S.w.q>0) S.w.q--; render(); },
  gHit(){ const w=S.w; w.last=gPoints(w.h); w.score+=w.last; gLog(); go("wGuessAfter"); confetti(); },
  gGiveUp(){ S.w.last=0; gLog(); go("wGuessAfter"); },
  // ④
  sSetup(){ S.sGames=S.sGames||2; if(S.sTheme===undefined) S.sTheme=-1; if(S.sRefill===undefined) S.sRefill=true; go("sSetup"); },
  sTheme(d){ S.sTheme=+d.n; render(); },
  sRefill(d){ S.sRefill=d.n==="1"; render(); },
  sGames(d){ S.sGames=+d.n; render(); },
  sStart(){ S.s={games:S.sGames||2, g:0, wins:0, log:[], themeIdx:(S.sTheme===undefined?-1:S.sTheme), refill:S.sRefill!==false}; sNewGame(); handoff(sGiver(), ()=>go("sClue")); },
  sPickH(d){ S.s.pickH=+d.i; render(); },
  sGive(d){ const s=S.s; if(s.pickH<0) return; const c=s.hand.splice(s.pickH,1)[0]; s.clues.push({c, t:d.t, removed:[]});
    if(s.refill && s.pile.length) s.hand.push(s.pile.shift()); s.pickH=-1; s.sel=[]; go("sBoard"); },
  sSel(d){ const s=S.s, i=+d.i, k=s.sel.indexOf(i); if(k>=0) s.sel.splice(k,1); else if(s.sel.length<S_REMOVE[s.round]) s.sel.push(i); render(); },
  sRemove(){ const s=S.s; if(s.sel.length!==S_REMOVE[s.round]) return; s.removed.push(...s.sel);
    s.clues[s.round].removed = s.sel.map(i=>s.grid[i]);
    const endGame = ok => { s.log.push({theme:s.theme, secretCard:s.grid[s.secret], giver:sGiver(), taker:sTaker(), clues:s.clues.map(k=>({...k})), ok}); recSimilo(s.log[s.log.length-1]); s.sel=[]; go("sResult"); if(ok) confetti(); };
    if(s.sel.includes(s.secret)){ s.failed=true; return endGame(false); }
    s.sel=[]; s.round++; if(s.round>=S_REMOVE.length){ s.wins++; return endGame(true); }
    handoff(sGiver(), ()=>go("sClue")); },
  sNext(){ const s=S.s; s.g++; if(s.g>=s.games){ go("sFinal"); if(s.wins/s.games>=.5) confetti(); return; } sNewGame(); handoff(sGiver(), ()=>go("sClue")); },
  // ⑤
  rSetup(){ S.rRounds=S.rRounds||2; go("rSetup"); },
  rRounds(d){ S.rRounds=+d.n; render(); },
  rStart(){ S.r={rounds:(S.rRounds||2)*2, i:0, pts:[0,0], log:[], topics:shuffle(RANK_TOPICS)}; rNewRound(); go("rTopic"); },
  rToAns(){ handoff(rAns(), ()=>{ S.r.cur="ans"; go("rAnswer"); }); },
  rPick(d){ const o=S.r[S.r.cur], i=+d.i; if(o.length<5 && !o.includes(i)) o.push(i); render(); },
  rUndo(){ S.r[S.r.cur].pop(); render(); },
  rReset(){ S.r[S.r.cur].length=0; render(); },
  rDone(){ const r=S.r;
    if(r.cur==="ans"){ if(r.ans.length<5) return; handoff(rPred(), ()=>{ r.cur="pred"; go("rPredict"); }); return; }
    if(r.pred.length<5) return; const j=rJudge(r.ans, r.pred); r.last=j; r.pts[rPred()]+=j.pts;
    r.log.push({topic:r.topic, label:r.label, items:[...r.items], a:[...r.ans], p:[...r.pred], ans:rAns(), pred:rPred(), j, pts:j.pts});
    go("rReveal"); if(j.perfect) confetti(); },
  rNext(){ const r=S.r; r.i++; if(r.i>=r.rounds){ recRank(r); go("rFinal"); confetti(); return; } rNewRound(); go("rTopic"); },
  // スロットと記録（消すときは2回タップで確定）
  slots(){ go("slots"); },
  slotUse(d){ useSlot(+d.i); go("home"); },
  slotDel(d){ const k="slot"+d.i; if(S.armKey!==k){ S.armKey=k; render(); return; } deleteSlot(+d.i); S.armKey=null; render(); },
  recOpen(d){ S.recTab=d.g||"all"; go("rec"); },
  recTab(d){ S.recTab=d.g; S.armKey=null; render(); },
  recClear(){ if(S.armKey!=="rec"){ S.armKey="rec"; render(); return; } clearRecords(); S.armKey=null; render(); },
  // ホームに戻る（遊んでいる途中は2回タップで確定）
  homeAsk(){ if(SAFE_HOME.includes(S.screen) || S.homeArmed) return go("home");
    S.homeArmed=true; const b=document.getElementById("homeBtn"); if(b){ b.textContent="途中でやめてホームに戻る？（もう一度タップ）"; b.classList.add("armed"); } }
};

app.addEventListener("click", e => { const t=e.target.closest("[data-act]"); if(!t||t.disabled) return; const f=A[t.dataset.act]; if(f) f(t.dataset); });
app.addEventListener("input", e => { const id=e.target.id, v=e.target.value;
  if(id==="nameA"||id==="nameB"){ const p=id==="nameA"?0:1; S.names[p]=v.trim()||DEFAULT_NAMES[p]; saveNames();
    const sb=document.getElementById(p?"sbB":"sbA"); if(sb) sb.textContent=S.names[p]; }
  if(id==="ownAns"){ S.w.own=v.trim(); const b=document.getElementById("ownBtn"); if(b) b.disabled=!S.w.own; }
  if(id==="hint1"||id==="hint2"){ S.m.hints[id==="hint1"?0:1]=v.trim(); const b=document.getElementById("passBtn"); if(b) b.disabled=!(S.m.hints[0]||S.m.hints[1]); }
  if(id==="guess"||id==="honne"){ const n=+v; if(id==="guess") S.m.guess=n; else S.m.target=n;
    const mk=app.querySelector(".mk.guess"); if(mk){ mk.style.left=n+"%"; mk.querySelector("span").textContent=(id==="guess"?"予想 ":"本音 ")+n; } }
});

// 保存データを読み込んでから、最初の画面を出す
saveInit();
render();
