(() => {
  const SUBSCRIPTION_ID = 'com.leerdarija.premium.yearly';

  const state = {
    activeView: 'homeView',
    levelFilter: 'ALL',
    score: Number(localStorage.getItem('darijaScore') || 0),
    learned: new Set(JSON.parse(localStorage.getItem('darijaLearned') || '[]')),
    currentLesson: null,
    product: null,
    premium: false,
    storeChecked: false,
    lastLessonId: localStorage.getItem('darijaLastLesson') || null
  };

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const lessons = () => window.LESSONS || [];
  const allItems = () => lessons().flatMap(l => l.items || []);
  const store = () => window.Capacitor?.Plugins?.StoreKitBridge || null;

  function saveLearned() {
    localStorage.setItem('darijaLearned', JSON.stringify([...state.learned]));
  }

  function setView(id, updateNav = true) {
    $$('.view').forEach(v => v.classList.add('hidden'));
    $('#' + id).classList.remove('hidden');
    state.activeView = id;

    const showNav = !['lessonView', 'paywallView'].includes(id);
    $('#bottomNav').classList.toggle('hidden', !showNav);

    if (updateNav && showNav) {
      $$('.nav-button').forEach(b => b.classList.toggle('active', b.dataset.view === id));
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function subscriptionPrice() {
    return state.product?.displayPrice || (state.storeChecked ? 'Niet beschikbaar' : 'Prijs laden…');
  }

  function renderMembership() {
    $('#subscriptionPrice').textContent = subscriptionPrice();

    if (state.premium) {
      $('#membershipPill').textContent = '✦ Premium';
      $('#membershipStatus').textContent = 'Premium actief';
      $('#membershipBadge').textContent = 'Actief';
      $('#membershipBadge').classList.add('active-premium');
      $('#membershipDetail').textContent = 'Alle Basis-, A1- en A2-lessen zijn beschikbaar.';
      $('#profileSubscribe').textContent = 'Premium actief';
      $('#profileSubscribe').disabled = true;
    } else {
      $('#membershipPill').textContent = '7 dagen gratis';
      $('#membershipStatus').textContent = 'Geen actief abonnement';
      $('#membershipBadge').textContent = 'Gratis';
      $('#membershipBadge').classList.remove('active-premium');
      $('#membershipDetail').textContent = 'Start je 7-daagse gratis proefperiode om alle lessen te openen.';
      $('#profileSubscribe').textContent = 'Start 7 dagen gratis';
      $('#profileSubscribe').disabled = false;
    }
  }

  function storeMessage() {
    if (!store()) return 'Abonnementen zijn alleen beschikbaar in de geïnstalleerde iOS/TestFlight-app.';
    if (state.storeChecked && !state.product) {
      return `Apple geeft ${SUBSCRIPTION_ID} nog niet terug. Controleer het abonnement in App Store Connect en probeer later opnieuw.`;
    }
    return '';
  }

  async function initStore() {
    const bridge = store();
    if (!bridge) {
      state.storeChecked = true;
      renderMembership();
      $('#storeStatus').textContent = storeMessage();
      return;
    }

    try {
      const response = await bridge.getProducts({ ids: [SUBSCRIPTION_ID] });
      state.product = (response.products || []).find(p => p.id === SUBSCRIPTION_ID) || null;

      const entitlements = await bridge.getEntitlements();
      state.premium = (entitlements.productIds || []).includes(SUBSCRIPTION_ID);
    } catch (e) {
      console.warn('StoreKit init failed', e);
    } finally {
      state.storeChecked = true;
      renderMembership();
      $('#storeStatus').textContent = storeMessage();
      renderHome();
      renderLessons();
    }
  }

  async function startSubscription() {
    const bridge = store();

    if (!bridge) {
      $('#storeStatus').textContent = 'Open deze build via TestFlight op iPhone om de gratis proefperiode te testen.';
      setView('paywallView', false);
      return;
    }

    if (!state.product) {
      $('#storeStatus').textContent = storeMessage();
      setView('paywallView', false);
      return;
    }

    try {
      const result = await bridge.purchase({ id: SUBSCRIPTION_ID });
      if (result.purchased) {
        state.premium = true;
        renderMembership();
        renderHome();
        renderLessons();
        setView('homeView');
      } else if (result.pending) {
        $('#storeStatus').textContent = 'De aankoop wacht nog op goedkeuring.';
      }
    } catch (e) {
      const message = String(e?.message || e).toLowerCase();
      if (message.includes('cancel')) return;
      $('#storeStatus').textContent = 'De proefperiode kon niet worden gestart. Controleer je TestFlight- en App Store Connect-configuratie.';
    }
  }

  async function restorePurchases() {
    const bridge = store();
    if (!bridge) {
      alert('Herstellen is alleen beschikbaar in de geïnstalleerde iOS/TestFlight-app.');
      return;
    }

    try {
      await bridge.restore();
      const entitlements = await bridge.getEntitlements();
      state.premium = (entitlements.productIds || []).includes(SUBSCRIPTION_ID);
      renderMembership();
      renderHome();
      renderLessons();
      alert(state.premium ? 'Je Premium-toegang is hersteld.' : 'Er is geen actief abonnement gevonden.');
    } catch {
      alert('Herstellen is niet gelukt. Probeer het later opnieuw.');
    }
  }

  function lessonLabel(l) {
    if (l.tier === 'FREE') return 'Basis';
    return l.level || l.tier;
  }

  function renderHome() {
    const total = allItems().length;
    const learned = state.learned.size;
    const pct = total ? Math.min(100, Math.round((learned / total) * 100)) : 0;

    $('#totalCount').textContent = total;
    $('#learnedCount').textContent = learned;
    $('#scoreCount').textContent = state.score;
    $('#progressPercent').textContent = pct + '%';
    $('#progressFill').style.width = pct + '%';

    const preferred = lessons().find(l => l.id === state.lastLessonId) || lessons()[0];
    if (preferred) {
      $('#continueTitle').textContent = preferred.title;
      $('#continueSubtitle').textContent = `${lessonLabel(preferred)} · ${preferred.items.length} onderdelen`;
      $('#continueButton').onclick = () => requestLesson(preferred);
    }

    renderMembership();
  }

  function levelTitle(tier) {
    if (tier === 'FREE') return 'Basis';
    return tier;
  }

  function renderLessons() {
    const host = $('#lessonList');
    host.innerHTML = '';

    const filtered = lessons().filter(l => state.levelFilter === 'ALL' || l.tier === state.levelFilter);
    let lastTier = null;

    filtered.forEach(l => {
      if (state.levelFilter === 'ALL' && l.tier !== lastTier) {
        const divider = document.createElement('div');
        divider.className = 'level-divider';
        divider.innerHTML = `<strong>${levelTitle(l.tier)}</strong><span>${l.tier === 'FREE' ? 'start' : 'niveau'}</span>`;
        host.appendChild(divider);
        lastTier = l.tier;
      }

      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'lesson-row';
      row.innerHTML = `
        <div class="lesson-emoji">${l.emoji}</div>
        <div class="lesson-info">
          <strong>${l.title}</strong>
          <span>${lessonLabel(l)} · ${l.items.length} onderdelen</span>
        </div>
        <div class="lesson-arrow">${state.premium ? '›' : '›'}</div>`;
      row.onclick = () => requestLesson(l);
      host.appendChild(row);
    });
  }

  function requestLesson(l) {
    if (!state.premium) {
      state.currentLesson = l;
      $('#storeStatus').textContent = storeMessage();
      setView('paywallView', false);
      return;
    }
    openLesson(l);
  }

  function markLearned(l, index) {
    state.learned.add(`${l.id}:${index}`);
    saveLearned();
    renderHome();
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-MA';
    utterance.rate = .82;
    speechSynthesis.speak(utterance);
  }

  function openLesson(l) {
    state.currentLesson = l;
    state.lastLessonId = l.id;
    localStorage.setItem('darijaLastLesson', l.id);

    $('#lessonTopTitle').textContent = `${l.emoji} ${l.title}`;
    $('#lessonTopLevel').textContent = lessonLabel(l);
    const host = $('#lessonContent');
    host.innerHTML = '';

    l.items.forEach((item, index) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div class="arabic">${item[0]}</div>
        <div class="latin">${item[1]}</div>
        <div class="nl">${item[2]}</div>`;
      const listen = document.createElement('button');
      listen.type = 'button';
      listen.className = 'listen-action';
      listen.textContent = '🔊 Luister';
      listen.onclick = () => {
        speak(item[0]);
        markLearned(l, index);
      };
      card.appendChild(listen);
      host.appendChild(card);
    });

    newQuestion();
    setView('lessonView', false);
  }

  function shuffle(a) {
    return [...a].sort(() => Math.random() - .5);
  }

  function newQuestion() {
    const l = state.currentLesson;
    if (!l?.items?.length) return;
    const current = l.items[Math.floor(Math.random() * l.items.length)];

    $('#qArabic').textContent = current[0];
    $('#qLatin').textContent = current[1];
    $('#feedback').textContent = '';
    $('#answers').innerHTML = '';

    const options = shuffle([current, ...shuffle(l.items.filter(x => x !== current && x[2] !== current[2])).slice(0, 3)]);
    options.forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'answer';
      button.textContent = option[2];
      button.onclick = () => {
        $$('#answers .answer').forEach(x => x.disabled = true);
        if (option === current) {
          button.classList.add('ok');
          $('#feedback').textContent = '✓ Goed';
          state.score += 1;
          localStorage.setItem('darijaScore', state.score);
          renderHome();
        } else {
          button.classList.add('bad');
          $('#feedback').textContent = 'Juist antwoord: ' + current[2];
          $$('#answers .answer').forEach(x => {
            if (x.textContent === current[2]) x.classList.add('ok');
          });
        }
      };
      $('#answers').appendChild(button);
    });
  }

  function startDaily() {
    if (!state.premium) {
      $('#storeStatus').textContent = storeMessage();
      setView('paywallView', false);
      return;
    }
    const l = lessons()[Math.floor(Math.random() * lessons().length)];
    openLesson(l);
  }

  $$('.nav-button').forEach(button => {
    button.addEventListener('click', () => setView(button.dataset.view));
  });

  $$('.segment').forEach(button => {
    button.addEventListener('click', () => {
      state.levelFilter = button.dataset.level;
      $$('.segment').forEach(x => x.classList.toggle('active', x === button));
      renderLessons();
    });
  });

  $('#membershipPill').onclick = () => setView(state.premium ? 'profileView' : 'paywallView', false);
  $('#profileSubscribe').onclick = () => setView('paywallView', false);
  $('#startTrial').onclick = startSubscription;
  $('#restorePurchases').onclick = restorePurchases;
  $('#paywallRestore').onclick = restorePurchases;
  $('#paywallClose').onclick = () => setView(state.activeView === 'paywallView' ? 'homeView' : 'homeView');
  $('#lessonBack').onclick = () => setView('learnView');
  $('#nextQuestion').onclick = newQuestion;
  $('#dailyCard').onclick = startDaily;

  renderHome();
  renderLessons();
  initStore();
})();
