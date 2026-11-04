// ===== 保存の部品（スロット3つ・設定） =====
// 保存先はその端末のブラウザの中（localStorage）だけ。ネットには送らない。
// localStorage が使えない環境では保存だけを止める（遊ぶことはできる。記録はページを閉じるまで残る）。
const APP_VER = "12.1";         // アプリの版。sw.js の CACHE と同じ番号にそろえる（更新のお知らせに使う）
const SAVE_KEY = "futari-machijikan";
const SAVE_VER = 1;              // 保存データの形の版番号。形を変えたら上げて、saveNormalize で読み替える
const SLOT_N = 3, LOG_MAX = 100; // スロットの数、1回ごとの記録を残す件数（古いものから消す）

const SV = { ok:false, data:null };

// 通算の記録（ゲームごと）
function newStats(){ return {
  ito:{ tries:0, wins:0, best:0, streak:0, bestStreak:0 },              // best＝成功した最高枚数（全体）
  meter:{ games:0, rounds:0, pts:0, exact:0, best:null },               // best＝いちばん近かった1回
  words:{ w2:{games:0,q:0,hit:0}, w3:{games:0,q:0,hit:0}, w4:{games:0,q:0,hit:0}, guess:{games:0,q:0,pts:[0,0]} },
  similo:{ games:0, wins:0, themes:{} },                                // themes＝{テーマ名:{games,wins}}
  rank:{ games:0, wins:[0,0], draws:0, perfect:0, roles:{} }            // roles＝{役の名前:回数}
}; }
function newSlot(){ return { names:[...DEFAULT_NAMES], plays:0, last:0, stats:newStats(), log:[] }; }
function newSave(){ return { ver:SAVE_VER, cur:0, slots:Array(SLOT_N).fill(null), settings:{ wake:true, appVer:"" } }; }

// 足りない項目を初期値で埋める（古い保存データや、形の崩れたデータでも動くように）
function fillDefaults(base, v){
  if(!v || typeof v!=="object" || Array.isArray(v)) return base;
  for(const k in base){
    const b=base[k], x=v[k];
    if(b && typeof b==="object" && !Array.isArray(b)) base[k]=fillDefaults(b, x);
    else if(x!==undefined && typeof x===typeof b && Array.isArray(x)===Array.isArray(b)) base[k]=x;
  }
  for(const k in v) if(!(k in base)) base[k]=v[k];   // テーマ名・役の名前など、初期値にない項目も残す
  return base;
}
function saveNormalize(raw){
  const d=newSave(); if(!raw || typeof raw!=="object") return d;
  if([0,1,2].includes(raw.cur)) d.cur=raw.cur;
  const st=raw.settings;
  if(st && typeof st==="object"){ if(typeof st.wake==="boolean") d.settings.wake=st.wake; if(typeof st.appVer==="string") d.settings.appVer=st.appVer; }
  if(Array.isArray(raw.slots)) for(let i=0;i<SLOT_N;i++){ const s=raw.slots[i]; if(!s || typeof s!=="object") continue;
    const n=newSlot();
    if(Array.isArray(s.names)) n.names=[0,1].map(p=>typeof s.names[p]==="string" && s.names[p].trim() ? s.names[p].slice(0,8) : DEFAULT_NAMES[p]);
    if(typeof s.plays==="number") n.plays=s.plays;
    if(typeof s.last==="number") n.last=s.last;
    n.stats=fillDefaults(newStats(), s.stats);
    if(Array.isArray(s.log)) n.log=s.log.filter(x=>x && typeof x==="object" && typeof x.g==="string").slice(-LOG_MAX);
    d.slots[i]=n; }
  return d;
}

// 読み込み（最初に1回）
function saveInit(){
  let raw=null;
  try{
    const ls=window.localStorage, t="__futari_test";
    ls.setItem(t,"1"); ls.removeItem(t); SV.ok=true;
    const txt=ls.getItem(SAVE_KEY);
    if(txt){ try{ raw=JSON.parse(txt); }catch(e){ try{ ls.setItem(SAVE_KEY+"-broken", txt); }catch(e2){} raw=null; } }   // 壊れていたら控えを残して作り直す
  }catch(e){ SV.ok=false; }
  // 新しい版のアプリで保存されたデータは、上書きして壊さないよう読むだけにする
  if(raw && typeof raw.ver==="number" && raw.ver>SAVE_VER) SV.ok=false;
  SV.data=saveNormalize(raw);
  // 更新のお知らせ：前に開いたときの版と違えば「新しい版にしました」
  const st=SV.data.settings;
  S.updated = SV.ok && !!st.appVer && st.appVer!==APP_VER;
  st.appVer=APP_VER;
  const s=curSlot(); S.names = s ? [...s.names] : [...DEFAULT_NAMES];
  saveWrite();
}
function saveWrite(){
  if(!SV.ok) return;
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(SV.data)); }catch(e){ /* 容量がいっぱいなど：保存だけあきらめる */ }
}

// ===== スロット =====
const curSlot = () => SV.data.slots[SV.data.cur];
// 今のスロットが空なら、今の名前で作る
function ensureSlot(){ const d=SV.data; if(!d.slots[d.cur]){ const n=newSlot(); n.names=[...S.names]; d.slots[d.cur]=n; } return d.slots[d.cur]; }
function useSlot(i){ SV.data.cur=i; const s=SV.data.slots[i]; S.names = s ? [...s.names] : [...DEFAULT_NAMES]; saveWrite(); }
function deleteSlot(i){ SV.data.slots[i]=null; if(i===SV.data.cur) S.names=[...DEFAULT_NAMES]; saveWrite(); }
function saveNames(){ const s=ensureSlot(); s.names=[...S.names]; saveWrite(); }
// 記録を1件足す。upd で通算の数字を更新する
function recAdd(g, entry, upd){
  const s=ensureSlot(), now=Date.now();
  upd(s.stats[g]);
  s.log.push({ g, t:now, ...entry });
  if(s.log.length>LOG_MAX) s.log.splice(0, s.log.length-LOG_MAX);
  s.plays++; s.last=now; saveWrite();
}
// このスロットの記録を消す（名前は残す）
function clearRecords(){ const s=curSlot(); if(!s) return; s.stats=newStats(); s.log=[]; s.plays=0; s.last=0; saveWrite(); }
// 今のスロットの通算（空なら初期値）
const curStats = g => (curSlot() ? curSlot().stats : newStats())[g];
const setting = k => SV.data.settings[k];
function setSetting(k, v){ SV.data.settings[k]=v; saveWrite(); }
