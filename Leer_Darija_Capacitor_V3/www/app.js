
(() => {
  const PRODUCTS = { A1: 'com.leerdarija.a1', A2: 'com.leerdarija.a2' };
  const state = {
    filter: 'ALL', current: null, score: Number(localStorage.getItem('score') || 0),
    entitlements: new Set(JSON.parse(localStorage.getItem('entitlements') || '[]')),
    products: {}, storeAvailable: false
  };
  const $ = s => document.querySelector(s); const $$ = s => [...document.querySelectorAll(s)];
  const allItems = () => window.LESSONS.flatMap(l => l.items);
  const isUnlocked = lesson => lesson.tier === 'FREE' || state.entitlements.has(lesson.tier);
  const productIdFor = tier => PRODUCTS[tier];
  function nativeStore(){ return window.Capacitor?.Plugins?.StoreKitBridge || null; }
  function saveEntitlements(){ localStorage.setItem('entitlements', JSON.stringify([...state.entitlements])); }
  function show(view){ $$('.view').forEach(v=>v.classList.add('hidden')); $('#'+view).classList.remove('hidden'); window.scrollTo({top:0,behavior:'smooth'}); }
  function setTab(name){ $$('.tabbar button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name)); }
  function productLabel(tier){ const p=state.products[productIdFor(tier)]; return p?.displayPrice || (tier==='A1'?'Prijs in App Store':'Prijs in App Store'); }
  async function initStore(){
    const store=nativeStore();
    if(!store){ renderStore(); return; }
    state.storeAvailable=true;
    try{
      const products=await store.getProducts({ids:Object.values(PRODUCTS)});
      (products.products||[]).forEach(p=>state.products[p.id]=p);
      const e=await store.getEntitlements();
      (e.productIds||[]).forEach(id=>{ if(id===PRODUCTS.A1)state.entitlements.add('A1'); if(id===PRODUCTS.A2)state.entitlements.add('A2'); });
      saveEntitlements();
    }catch(err){ console.warn('StoreKit init',err); }
    renderAll();
  }
  async function buy(tier){
    const store=nativeStore(); if(!store){ alert('Aankopen werken in de iOS-app via de App Store.'); return; }
    try{
      const r=await store.purchase({id:productIdFor(tier)});
      if(r.purchased){ state.entitlements.add(tier); saveEntitlements(); renderAll(); if(state.current?.tier===tier) openLesson(state.current.id); }
    }catch(err){ if(String(err?.message||err).toLowerCase().includes('cancel')) return; alert('De aankoop kon niet worden afgerond. Probeer het later opnieuw.'); }
  }
  async function restore(){ const store=nativeStore(); if(!store){ alert('Herstellen is alleen beschikbaar in de iOS-app.'); return; } try{ await store.restore(); await initStore(); alert('Aankopen zijn hersteld.'); }catch(e){ alert('Herstellen is niet gelukt.'); } }
  function renderStore(){
    ['A1','A2'].forEach(tier=>{
      const owned=state.entitlements.has(tier); const btn=$(`#buy${tier}`); const price=$(`#price${tier}`);
      price.textContent=owned?'Ontgrendeld':productLabel(tier);
      btn.textContent=owned?'Gekocht ✓':`${tier} ontgrendelen`;
      btn.disabled=owned; btn.onclick=()=>buy(tier);
    });
  }
  function renderLessons(){
    const list=$('#lessonGrid'); list.innerHTML='';
    window.LESSONS.filter(l=>state.filter==='ALL'||l.tier===state.filter).forEach(l=>{
      const unlocked=isUnlocked(l); const el=document.createElement('article'); el.className='lesson-card';
      el.innerHTML=`<div class="lesson-info"><div class="emoji">${l.emoji}</div><div class="lesson-copy"><h3>${l.title}</h3><p>${l.subtitle}</p><span class="tag">${l.level} · ${l.items.length} onderdelen</span>${unlocked?'':` <span class="lock">🔒 Betaald</span>`}</div></div>`;
      const b=document.createElement('button'); b.className='btn '+(unlocked?'':'ghost'); b.textContent=unlocked?'Open':'Bekijk'; b.addEventListener('click',()=>openLesson(l.id)); el.appendChild(b); list.appendChild(el);
    });
  }
  function renderHeader(){ $('#lessonCount').textContent=window.LESSONS.length; $('#phraseCount').textContent=allItems().length; $('#score').textContent=state.score; }
  function renderAll(){ renderHeader(); renderStore(); renderLessons(); }
  function speak(text){ if(!('speechSynthesis' in window))return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang='ar-MA'; u.rate=.82; speechSynthesis.speak(u); }
  function openLesson(id){
    const l=window.LESSONS.find(x=>x.id===id); if(!l)return; state.current=l; $('#lessonTitle').textContent=`${l.emoji} ${l.title}`; $('#lessonLevel').textContent=l.level;
    const unlocked=isUnlocked(l); $('#cards').innerHTML=''; $('#quiz').classList.toggle('hidden',!unlocked); $('#paywall').classList.toggle('hidden',unlocked);
    if(!unlocked){ $('#paywallTitle').textContent=`Ontgrendel ${l.tier}`; $('#paywallText').textContent=`Deze les hoort bij ${l.tier}. Ontgrendel het volledige niveau eenmalig en behoud toegang.`; $('#paywallPrice').textContent=productLabel(l.tier); $('#paywallBuy').textContent=`Koop ${l.tier}`; $('#paywallBuy').onclick=()=>buy(l.tier); show('lessonView'); return; }
    l.items.forEach(item=>{ const c=document.createElement('article'); c.className='card'; c.innerHTML=`<div class="arabic">${item[0]}</div><div class="latin">${item[1]}</div><div class="nl">${item[2]}</div>`; const b=document.createElement('button'); b.className='btn ghost listen'; b.textContent='🔊 Luister'; b.onclick=()=>speak(item[0]); c.appendChild(b); $('#cards').appendChild(c); });
    newQuestion(); show('lessonView');
  }
  function shuffle(a){ return [...a].sort(()=>Math.random()-.5); }
  function newQuestion(){ const l=state.current; if(!l||!isUnlocked(l))return; const pool=l.items; const current=pool[Math.floor(Math.random()*pool.length)]; $('#qArabic').textContent=current[0]; $('#qLatin').textContent=current[1]; $('#answers').innerHTML=''; $('#feedback').textContent=''; const opts=shuffle([current,...shuffle(pool.filter(x=>x!==current&&x[2]!==current[2])).slice(0,3)]); opts.forEach(o=>{ const b=document.createElement('button'); b.className='answer'; b.textContent=o[2]; b.onclick=()=>{ $$('#answers .answer').forEach(x=>x.disabled=true); if(o===current){b.classList.add('ok');$('#feedback').textContent='✅ Goed!';state.score++;localStorage.setItem('score',state.score);$('#score').textContent=state.score;}else{b.classList.add('bad');$('#feedback').textContent='❌ '+current[2];$$('#answers .answer').forEach(x=>{if(x.textContent===current[2])x.classList.add('ok')});}}; $('#answers').appendChild(b); }); }
  $$('.pill[data-filter]').forEach(b=>b.onclick=()=>{$$('.pill[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;renderLessons();});
  $('#back').onclick=()=>show('homeView'); $('#nextQuestion').onclick=newQuestion; $('#restore').onclick=restore; $('#restore2').onclick=restore;
  $$('.tabbar button').forEach(b=>b.onclick=()=>{setTab(b.dataset.tab); if(b.dataset.tab==='learn')show('homeView'); if(b.dataset.tab==='store'){$('#storeSection').scrollIntoView({behavior:'smooth'});} if(b.dataset.tab==='progress'){$('#progressSection').scrollIntoView({behavior:'smooth'});}});
  renderAll(); initStore();
})();
