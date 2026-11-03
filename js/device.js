// ===== 端末まわり：オフライン対応（サービスワーカー）・ホーム画面に追加・画面をつけたまま =====
// index.html をダブルクリックで開いたとき（file://）は、この仕組みは使わない（普通に遊べる）。
const IS_WEB = /^https?:$/.test(location.protocol);
const IS_STANDALONE = (() => { try{ return matchMedia("(display-mode: standalone)").matches || navigator.standalone===true; }catch(e){ return false; } })();

if(IS_WEB){
  // manifest は公開URLのときだけ読む（file:// で読むとブラウザがエラーを出すため）
  try{ const l=document.createElement("link"); l.rel="manifest"; l.href="manifest.webmanifest"; document.head.appendChild(l); }catch(e){}
  try{ if("serviceWorker" in navigator) window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(()=>{}); }); }catch(e){}
}

// ホームに出す「ホーム画面に追加する方法」（ホーム画面から開いているときは出さない）
const installHelp = () => IS_STANDALONE ? "" : `
  <details class="panel howto"><summary>ホーム画面に追加する方法</summary>
    <p><b>iPhone（Safari）</b>：共有ボタン（□に↑。見つからなければ「…」の中）→「ホーム画面に追加」</p>
    <p><b>Android（Chrome）</b>：右上の「︙」→「ホーム画面に追加」または「アプリをインストール」</p>
    <p class="sub">追加すると、アイコン（番号札の絵・名前は「ふたり」）から全画面で開けます。一度ネットにつながった状態で開いておけば、電波がなくても遊べます。</p>
  </details>`;

// ===== 画面をつけたまま（Screen Wake Lock） =====
// 設定がオンで、画面が見えている間だけお願いする。使えない機種・ブラウザでは何もしない。
const WAKE = { lock:null, busy:false, again:false };
const wakeSupported = () => { try{ return "wakeLock" in navigator && typeof navigator.wakeLock.request==="function"; }catch(e){ return false; } };
async function wakeSync(){
  if(!wakeSupported()) return;
  if(WAKE.busy){ WAKE.again=true; return; }   // お願いの途中で設定が変わったら、終わってからもう一度合わせる
  const want = !!setting("wake") && document.visibilityState==="visible";
  WAKE.busy=true;
  try{
    if(want && !WAKE.lock){ const l=await navigator.wakeLock.request("screen"); WAKE.lock=l; l.addEventListener("release", () => { if(WAKE.lock===l) WAKE.lock=null; }); }
    else if(!want && WAKE.lock){ const l=WAKE.lock; WAKE.lock=null; await l.release(); }
  }catch(e){ /* 電池が少ないときなど、断られることがある：何もしない */ }
  WAKE.busy=false;
  if(WAKE.again){ WAKE.again=false; wakeSync(); }
}
// 画面に戻ってきたとき・タップしたとき（ブラウザによってはタップのあとでないとお願いできない）に取り直す
document.addEventListener("visibilitychange", () => { wakeSync(); });
document.addEventListener("click", () => { if(!WAKE.lock) wakeSync(); });

// ホームに出す切り替え
const wakePanel = () => { const on=!!setting("wake"); return `
  <div class="panel">
    <div class="row" style="align-items:center;justify-content:space-between"><span>画面をつけたままにする</span>
      <button class="chip ${on?"on":""}" data-act="wakeToggle" aria-pressed="${on}">${on?"オン":"オフ"}</button></div>
    <p class="sub">${wakeSupported() ? "オンのあいだ、画面が自動で暗くならないようにします。" : "この端末・ブラウザでは使えないようです（遊ぶことはできます）。"}</p>
  </div>`; };
