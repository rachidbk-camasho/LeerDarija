(() => {
  const PRODUCTS = { A1: 'com.leerdarija.a1', A2: 'com.leerdarija.a2' };

  const LEVELS = {
    FREE: {
      title: 'Basis',
      kicker: 'GRATIS START',
      description: 'Leer de eerste woorden, begroetingen en de belangrijkste Darija-klanken.'
    },
    A1: {
      title: 'A1 – Basis Darija',
      kicker: 'NIVEAU A1',
      description: 'Praktische Darija voor voorstellen, cijfers, tijd, eten, taxi, winkelen en familie.'
    },
    A2: {
      title: 'A2 – Verder spreken',
      kicker: 'NIVEAU A2',
      description: 'Bouw langere zinnen en leer vragen, werkwoorden, gevoelens en sociale gesprekken.'
    }
  };

  const state = {
    level: 'FREE',
    current: null,
    score: Number(localStorage.getItem('score') || 0),
    entitlements: new Set(JSON.parse(localStorage.getItem('entitlements') || '[]')),
    products: {},
    storeAvailable: false,
    storeChecked: false
  };

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const allItems = () => window.LESSONS.flatMap(l => l.items);
  const isUnlockedTier = tier => tier === 'FREE' || state.entitlements.has(tier);
  const isUnlocked = lesson => isUnlockedTier(lesson.tier);
  const productIdFor = tier => PRODUCTS[tier];

  function nativeStore() {
    return window.Capacitor?.Plugins?.StoreKitBridge || null;
  }

  function saveEntitlements() {
    localStorage.setItem('entitlements', JSON.stringify([...state.entitlements]));
  }

  function show(view, smooth = false) {
    $$('.view').forEach(v => v.classList.add('hidden'));
    $('#' + view).classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  }

  function setBottomTab(name) {
    $$('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  }

  function productFor(tier) {
    return state.products[productIdFor(tier)] || null;
  }

  function productLabel(tier) {
    const p = productFor(tier);
    if (p?.displayPrice) return p.displayPrice;
    if (!state.storeChecked) return 'Prijs laden…';
    return 'Niet beschikbaar';
  }

  function storeErrorText(tier) {
    if (!nativeStore()) return 'Open de geïnstalleerde iOS/TestFlight-app om aankopen te testen.';
    if (state.storeChecked && !productFor(tier)) {
      return `Apple levert ${productIdFor(tier)} nog niet aan. Controleer het In-App Purchase-product in App Store Connect.`;
    }
    return '';
  }

  async function initStore() {
    const store = nativeStore();
    state.storeAvailable = !!store;

    if (!store) {
      state.storeChecked = true;
      renderAll();
      return;
    }

    try {
      const products = await store.getProducts({ ids: Object.values(PRODUCTS) });
      state.products = {};
      (products.products || []).forEach(p => state.products[p.id] = p);

      const e = await store.getEntitlements();
      (e.productIds || []).forEach(id => {
        if (id === PRODUCTS.A1) state.entitlements.add('A1');
        if (id === PRODUCTS.A2) state.entitlements.add('A2');
      });
      saveEntitlements();
    } catch (err) {
      console.warn('StoreKit init', err);
    } finally {
      state.storeChecked = true;
      renderAll();
    }
  }

  async function buy(tier) {
    const store = nativeStore();
    const product = productFor(tier);

    if (!store) {
      alert('Aankopen zijn alleen beschikbaar in de geïnstalleerde iOS/TestFlight-app.');
      return;
    }
    if (!product) {
      alert(`Dit testproduct is nog niet beschikbaar via Apple. Controleer in App Store Connect of ${productIdFor(tier)} bestaat, een prijs heeft en beschikbaar is voor verkoop.`);
      return;
    }

    try {
      const r = await store.purchase({ id: productIdFor(tier) });
      if (r.purchased) {
        state.entitlements.add(tier);
        saveEntitlements();
        renderAll();
        if (state.current?.tier === tier) openLesson(state.current.id);
      } else if (r.pending) {
        alert('De aankoop wacht nog op goedkeuring.');
      }
    } catch (err) {
      const msg = String(err?.message || err).toLowerCase();
      if (msg.includes('cancel') || msg.includes('user_cancelled')) return;
      alert('De aankoop kon niet worden afgerond. Controleer de TestFlight/App Store Connect-configuratie en probeer opnieuw.');
    }
  }

  async function restore() {
    const store = nativeStore();
    if (!store) {
      alert('Herstellen is alleen beschikbaar in de geïnstalleerde iOS/TestFlight-app.');
      return;
    }
    try {
      await store.restore();
      await initStore();
      alert('Aankopen zijn hersteld.');
    } catch (e) {
      alert('Herstellen is niet gelukt.');
    }
  }

  function setLevel(level, scroll = false) {
    state.level = level;
    $$('.level-tab').forEach(b => {
      const active = b.dataset.level === level;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });

    const cfg = LEVELS[level];
    $('#levelKicker').textContent = cfg.kicker;
    $('#levelTitle').textContent = cfg.title;
    $('#levelDescription').textContent = cfg.description;

    renderLevelAction();
    renderLessons();

    if (scroll) {
      requestAnimationFrame(() => $('.level-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  function renderLevelAction() {
    const host = $('#levelAction');
    host.innerHTML = '';

    if (state.level === 'FREE') {
      const badge = document.createElement('div');
      badge.className = 'included-badge';
      badge.textContent = '✓ Inbegrepen';
      host.appendChild(badge);
      return;
    }

    const tier = state.level;
    const owned = state.entitlements.has(tier);

    if (owned) {
      const badge = document.createElement('div');
      badge.className = 'included-badge';
      badge.textContent = '✓ Ontgrendeld';
      host.appendChild(badge);
      return;
    }

    const box = document.createElement('div');
    box.className = 'level-buy';
    const price = document.createElement('span');
    price.className = 'level-price';
    price.textContent = productLabel(tier);
    const btn = document.createElement('button');
    btn.className = 'btn primary compact-btn';
    btn.textContent = `${tier} ontgrendelen`;
    btn.disabled = state.storeChecked && !productFor(tier);
    btn.onclick = () => buy(tier);
    box.append(price, btn);

    const err = storeErrorText(tier);
    if (err) {
      const note = document.createElement('small');
      note.className = 'product-warning';
      note.textContent = err;
      box.appendChild(note);
    }
    host.appendChild(box);
  }

  function renderLessons() {
    const list = $('#lessonGrid');
    list.innerHTML = '';

    window.LESSONS
      .filter(l => l.tier === state.level)
      .forEach(l => {
        const unlocked = isUnlocked(l);
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'lesson-card lesson-link' + (unlocked ? '' : ' locked');
        el.setAttribute('aria-label', `${l.title}${unlocked ? '' : ', premium'}`);
        el.innerHTML = `
          <div class="lesson-leading">
            <div class="emoji">${l.emoji}</div>
            <div class="lesson-copy">
              <div class="lesson-title-row">
                <h3>${l.title}</h3>
                ${unlocked ? '' : '<span class="mini-lock">🔒</span>'}
              </div>
              <p>${l.subtitle}</p>
              <span class="tag">${l.level} · ${l.items.length} onderdelen</span>
            </div>
          </div>
          <div class="lesson-trailing" aria-hidden="true">
            ${unlocked ? '<span class="chevron">›</span>' : `<span class="locked-label">${productLabel(l.tier)}</span><span class="chevron">›</span>`}
          </div>`;
        el.addEventListener('click', () => openLesson(l.id));
        list.appendChild(el);
      });

    if (!list.children.length) {
      list.innerHTML = '<div class="empty-state">Er zijn nog geen lessen in dit niveau.</div>';
    }
  }

  function renderHeader() {
    $('#lessonCount').textContent = window.LESSONS.length;
    $('#phraseCount').textContent = allItems().length;
    $('#score').textContent = state.score;
    $('#scoreLarge').textContent = state.score;
    $('#a1TabState').textContent = state.entitlements.has('A1') ? 'Open' : 'Premium';
    $('#a2TabState').textContent = state.entitlements.has('A2') ? 'Open' : 'Premium';
  }

  function renderAll() {
    renderHeader();
    setLevel(state.level);
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-MA';
    u.rate = .82;
    speechSynthesis.speak(u);
  }

  function openLesson(id) {
    const l = window.LESSONS.find(x => x.id === id);
    if (!l) return;

    state.current = l;
    setBottomTab('learn');
    $('#lessonTitle').textContent = `${l.emoji} ${l.title}`;
    $('#lessonLevel').textContent = l.level;

    const unlocked = isUnlocked(l);
    $('#cards').innerHTML = '';
    $('#quiz').classList.toggle('hidden', !unlocked);
    $('#paywall').classList.toggle('hidden', unlocked);

    if (!unlocked) {
      $('#paywallTitle').textContent = `Ontgrendel ${l.tier}`;
      $('#paywallText').textContent = `Deze les hoort bij ${l.tier}. Met één aankoop ontgrendel je alle lessen van dit niveau.`;
      $('#paywallPrice').textContent = productLabel(l.tier);
      $('#paywallStatus').textContent = storeErrorText(l.tier);
      const buyBtn = $('#paywallBuy');
      buyBtn.textContent = `Ontgrendel ${l.tier}`;
      buyBtn.disabled = state.storeChecked && !productFor(l.tier);
      buyBtn.onclick = () => buy(l.tier);
      show('lessonView');
      return;
    }

    l.items.forEach(item => {
      const c = document.createElement('article');
      c.className = 'card';
      c.innerHTML = `<div class="arabic">${item[0]}</div><div class="latin">${item[1]}</div><div class="nl">${item[2]}</div>`;
      const b = document.createElement('button');
      b.className = 'listen-action';
      b.type = 'button';
      b.innerHTML = '<span>🔊</span><span>Luister</span>';
      b.onclick = () => speak(item[0]);
      c.appendChild(b);
      $('#cards').appendChild(c);
    });

    newQuestion();
    show('lessonView');
  }

  function shuffle(a) {
    return [...a].sort(() => Math.random() - .5);
  }

  function newQuestion() {
    const l = state.current;
    if (!l || !isUnlocked(l)) return;

    const pool = l.items;
    const current = pool[Math.floor(Math.random() * pool.length)];
    $('#qArabic').textContent = current[0];
    $('#qLatin').textContent = current[1];
    $('#answers').innerHTML = '';
    $('#feedback').textContent = '';

    const opts = shuffle([current, ...shuffle(pool.filter(x => x !== current && x[2] !== current[2])).slice(0, 3)]);
    opts.forEach(o => {
      const b = document.createElement('button');
      b.className = 'answer';
      b.textContent = o[2];
      b.onclick = () => {
        $$('#answers .answer').forEach(x => x.disabled = true);
        if (o === current) {
          b.classList.add('ok');
          $('#feedback').textContent = '✅ Goed!';
          state.score++;
          localStorage.setItem('score', state.score);
          renderHeader();
        } else {
          b.classList.add('bad');
          $('#feedback').textContent = '❌ ' + current[2];
          $$('#answers .answer').forEach(x => {
            if (x.textContent === current[2]) x.classList.add('ok');
          });
        }
      };
      $('#answers').appendChild(b);
    });
  }

  $$('.level-tab').forEach(b => b.addEventListener('click', () => setLevel(b.dataset.level)));

  $('#back').onclick = () => {
    setBottomTab('learn');
    show('homeView');
    requestAnimationFrame(() => $('.level-section')?.scrollIntoView({ block: 'start' }));
  };

  $('#nextQuestion').onclick = newQuestion;
  $('#restore').onclick = restore;
  $('#restore2').onclick = restore;

  $$('.tabbar button').forEach(b => b.onclick = () => {
    const tab = b.dataset.tab;
    setBottomTab(tab);
    show('homeView');

    if (tab === 'learn') {
      setLevel('FREE');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (tab === 'premium') {
      const tier = state.entitlements.has('A1') && !state.entitlements.has('A2') ? 'A2' : 'A1';
      setLevel(tier);
      requestAnimationFrame(() => $('.level-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
    if (tab === 'progress') {
      requestAnimationFrame(() => $('#progressSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  });

  renderAll();
  initStore();
})();
