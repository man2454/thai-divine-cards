'use strict';
const $=id=>document.getElementById(id);
let cfg, meanings={}, deck=[], selected=[], drawn=[], mode='quick', busy=false, soundOn=true;
const positions={1:['ไพ่ของคุณ'],3:['อดีต','ปัจจุบัน','อนาคต'],5:['สถานการณ์','อุปสรรค','สิ่งที่ควรรู้','แนวทาง','บทสรุป']};
const labels={quick:['เลือกไพ่จากกองสุ่ม','แตะไพ่เพื่อเลือกทีละใบ ไพ่จะยกขึ้น แล้วกดยืนยันเมื่อเลือกครบ'],grid:['เลือกไพ่จากทั้งสำรับ','แตะไพ่เพื่อเลือก แล้วกดยืนยันเมื่อครบจำนวน']};
function rand(max){const a=new Uint32Array(1),lim=Math.floor(4294967296/max)*max;do{crypto.getRandomValues(a)}while(a[0]>=lim);return a[0]%max}
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=rand(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function show(id){document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.id===id));window.scrollTo({top:0,behavior:'smooth'})}
let toastTimer;function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2500)}
function beep(){if(!soundOn||!cfg.enableSound)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C(),o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(550,c.currentTime);o.frequency.exponentialRampToValueAtTime(880,c.currentTime+.15);g.gain.setValueAtTime(.04,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.2);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.21);o.onended=()=>c.close()}catch{}}
function cardData(id){return meanings[id]||{id,name:`ไพ่หมายเลข ${id}`,meaning:'ยังไม่มีคำทำนายสำหรับไพ่ใบนี้ สามารถเพิ่มข้อมูลได้ใน js/cards-data.js'}}
function makeCard(id,{flipped=false,click=null}={}){const el=document.createElement('button');el.className='card'+(flipped?' flipped':'');el.type='button';el.setAttribute('aria-label',flipped?`ไพ่หมายเลข ${id}`:'ไพ่คว่ำหน้า');const inner=document.createElement('span');inner.className='card-inner';for(const face of ['back','front']){const side=document.createElement('span');side.className='card-face card-'+face;const fb=document.createElement('span');fb.className='fallback';const sym=document.createElement('span');sym.className='sigil';sym.textContent=face==='back'?'✺':'✦';const num=document.createElement('span');num.className='number';num.textContent=face==='back'?'ไพ่เทพพยากรณ์':`ใบที่ ${id}`;fb.append(sym,num);side.append(fb);const img=document.createElement('img');img.alt=face==='back'?'หลังไพ่':`หน้าไพ่ ${id}`;img.loading='lazy';img.src=face==='back'?cfg.cardBackImage:cfg.cardImagePath+id+cfg.cardImageExtension;img.onerror=()=>img.remove();side.append(img);inner.append(side)}el.append(inner);if(click)el.addEventListener('click',()=>click(el));return el}
function count(){return Number($('drawCount').value)||1}
function updateCount(){$('selectionCount').textContent=`เลือกแล้ว ${selected.length} / ${count()}`;const b=$('primaryBtn');b.textContent=mode==='quick'?`✦ ยืนยันไพ่ที่เลือก (${selected.length}/${count()})`:`✦ เปิดไพ่ที่เลือก (${selected.length}/${count()})`;b.disabled=busy||(mode==='quick'&&selected.length!==count())||(mode==='grid'&&selected.length!==count())}
function start(m){mode=m;selected=[];drawn=[];deck=shuffle(Array.from({length:cfg.cardCount},(_,i)=>i+1));$('modeLabel').textContent=m.toUpperCase();$('readingTitle').textContent=labels[m][0];$('readingHint').textContent=labels[m][1];$('drawCount').value=String(cfg.defaultDrawCount);show('reading');render()}
function render(){
 const stage=$('stage');stage.replaceChildren();stage.className='stage '+(mode==='grid'?'grid-stage':'quick-stage');
 if(mode==='quick'){
  const n=Math.min(deck.length,Math.max(count(),Number(cfg.quickChoiceCount)||21));for(let i=0;i<n;i++){const id=deck[i],el=makeCard(id);el.dataset.cardId=String(id);el.setAttribute('aria-pressed','false');el.style.setProperty('--tilt',`${(i-(n-1)/2)*Math.min(9,45/n)}deg`);el.addEventListener('click',()=>toggleQuickCard(id));stage.append(el)}updateQuickSelection()
 }else if(mode==='grid'){
  for(const id of deck){const el=makeCard(id);el.dataset.cardId=String(id);el.setAttribute('aria-pressed','false');el.addEventListener('click',()=>toggleGridCard(id));stage.append(el)}
  updateGridSelection();
 }
 updateCount();
}
function toggleQuickCard(id){
 if(busy)return;
 if(selected.includes(id))selected=selected.filter(v=>v!==id);
 else if(selected.length<count()){selected.push(id);beep()}
 else{toast('เลือกครบแล้ว กดยืนยันเพื่อเปิดไพ่');return}
 updateQuickSelection();updateCount();
}
function updateQuickSelection(){
 for(const el of $('stage').querySelectorAll('[data-card-id]')){
  const chosen=selected.includes(Number(el.dataset.cardId));
  el.classList.toggle('selected',chosen);el.setAttribute('aria-pressed',String(chosen));
 }
}
function toggleGridCard(id){
 if(busy)return;
 if(selected.includes(id))selected=selected.filter(v=>v!==id);
 else if(selected.length<count()){selected.push(id);beep()}
 else {toast('เลือกครบจำนวนแล้ว');return}
 updateGridSelection();updateCount();
}
function updateGridSelection(){
 for(const el of $('stage').querySelectorAll('[data-card-id]')){
  const id=Number(el.dataset.cardId),chosen=selected.includes(id);
  el.classList.toggle('selected',chosen);el.setAttribute('aria-pressed',String(chosen));
 }
}
function drawQuick(){if(busy||selected.length!==count())return;drawn=[...selected];finish()}
function finish(){drawn=[...selected];if(!drawn.length)return;beep();const root=$('resultCards');root.innerHTML='';drawn.forEach((id,i)=>{const item=document.createElement('div');item.className='result-item';const pos=document.createElement('div');pos.className='position-label';pos.textContent=(positions[drawn.length]||[])[i]||`ใบที่ ${i+1}`;const card=makeCard(id,{flipped:false});card.onclick=()=>{card.classList.toggle('flipped');beep()};const title=document.createElement('h3');title.textContent=cardData(id).name||`ไพ่หมายเลข ${id}`;const btn=document.createElement('button');btn.className='btn secondary';btn.textContent='อ่านคำทำนาย';btn.onclick=()=>openMeaning(id);item.append(pos,card,title,btn);root.append(item);setTimeout(()=>card.classList.add('flipped'),220+i*250)});show('results')}
function openMeaning(id){const c=cardData(id);$('meaningTitle').textContent=c.name_th||c.name||`ไพ่หมายเลข ${id}`;$('meaningKeywords').textContent=Array.isArray(c.keywords)?c.keywords.join(' • '):'';const body=$('meaningBody');body.innerHTML='';for(const [key,title] of [['meaning','ความหมายหลัก'],['love','ความรัก'],['career','การงาน'],['finance','การเงิน'],['advice','คำแนะนำ'],['reversed','ความหมายเมื่อกลับหัว']]){if(key==='reversed'&&!cfg.allowReversed)continue;if(!c[key])continue;const sec=document.createElement('div');sec.className='meaning-section';const heading=document.createElement('strong');heading.textContent=title;const p=document.createElement('p');p.textContent=c[key];sec.append(heading,p);body.append(sec)}$('meaningDialog').showModal()}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function animateShuffle(){
 if(busy)return;
 busy=true;updateCount();
 const stage=$('stage');
 const overlay=document.createElement('div');overlay.className='shuffle-overlay';
 overlay.setAttribute('role','status');overlay.setAttribute('aria-label','กำลังสับไพ่');
 const caption=document.createElement('div');caption.className='shuffle-caption';caption.textContent='กำลังสับไพ่…';
 overlay.append(caption);
 // Animated two piles with individually staggered cards; no reliance on the
 // arc layout's transform rules or Web Animations API.
 for(let i=0;i<16;i++){
  const el=makeCard(deck[i%deck.length]);el.className='card shuffle-piece';
  el.style.setProperty('--pile',i%2===0?'-1':'1');
  el.style.setProperty('--layer',String(Math.floor(i/2)));
  el.style.setProperty('--delay',`${Math.floor(i/2)*70}ms`);
  overlay.append(el);
 }
 stage.append(overlay);beep();
 const duration=Math.max(1500,Number(cfg.shuffleDurationMs)||2400);
 overlay.style.setProperty('--shuffle-time',`${duration}ms`);
 await sleep(duration+180);
 deck=shuffle([...deck]);selected=[];drawn=[];
 overlay.remove();busy=false;render();toast('สับไพ่เรียบร้อยแล้ว');
}
async function init(){try{cfg=window.APP_CONFIG;const data=window.CARDS_DATA;if(!cfg||!data)throw Error('ไม่พบข้อมูล APP_CONFIG หรือ CARDS_DATA กรุณาตรวจสอบไฟล์ js/config.js และ js/cards-data.js');if(!Number.isInteger(cfg.cardCount)||cfg.cardCount<1||cfg.cardCount>2000)throw Error('cardCount ต้องเป็นจำนวนเต็ม 1–2000');if(!Array.isArray(data.cards))throw Error('CARDS_DATA ต้องมี cards เป็น array');for(const c of data.cards){if(Number.isInteger(c.id)&&c.id>=1)meanings[c.id]=c}document.documentElement.style.setProperty('--gold',cfg.theme?.accent||'#d8ae65');document.documentElement.style.setProperty('--bg',cfg.theme?.background||'#100c16');$('brandName').textContent=cfg.appName||'ไพ่เทพพยากรณ์';document.title=cfg.appName||document.title;$('subtitle').textContent=cfg.subtitle||'';const opts=(cfg.drawOptions||[1,3,5,10]).filter(n=>Number.isInteger(n)&&n>0&&n<=cfg.cardCount);if(!opts.length)opts.push(1);if(!opts.includes(cfg.defaultDrawCount))cfg.defaultDrawCount=opts[0];$('drawCount').replaceChildren(...opts.map(n=>{const o=document.createElement('option');o.value=n;o.textContent=`${n} ใบ`;return o}));soundOn=!!cfg.enableSound;$('soundBtn').textContent=soundOn?'♪ เสียง: เปิด':'♪ เสียง: ปิด';document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>start(b.dataset.mode));$('primaryBtn').onclick=()=>{if(mode==='quick')drawQuick();else if(selected.length===count())finish()};$('drawCount').onchange=()=>{selected=[];render()};$('shuffleBtn').onclick=animateShuffle;$('resetBtn').onclick=()=>start(mode);$('againBtn').onclick=()=>start(mode);for(const id of ['homeBtn','backHome','resultHomeBtn','homeLink'])$(id).onclick=e=>{e.preventDefault();show('home')};$('soundBtn').onclick=()=>{soundOn=!soundOn;$('soundBtn').textContent=soundOn?'♪ เสียง: เปิด':'♪ เสียง: ปิด';if(soundOn)beep()};for(const id of ['closeDialog','closeDialogBottom'])$(id).onclick=()=>$('meaningDialog').close();$('meaningDialog').onclick=e=>{if(e.target===$('meaningDialog'))$('meaningDialog').close()}}catch(e){console.error(e);$('home').innerHTML=`<div class="hero"><h1>ไม่สามารถเริ่มแอปได้</h1><p id="errText"></p></div>`;$('errText').textContent=e.message+' — ตรวจสอบไฟล์ js/config.js และ js/cards-data.js'}}
init();
