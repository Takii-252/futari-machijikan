// ===== 端末まわり：オフライン対応（サービスワーカー）・ホーム画面に追加 =====
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
