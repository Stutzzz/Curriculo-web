/* =========================================================
   Leandro Stutz · Portfólio
   Animações e interações: Lenis (rolagem suave) + GSAP/ScrollTrigger
   ========================================================= */
(() => {
  'use strict';

  /* ---------- Ajustes rápidos ---------- */
  const CONTATO = {
    email: 'leandrostutzsilva14@gmail.com',
    whatsapp: '5511991914936', // só números: 55 + DDD + número
    enviarPor: 'email',        // 'email' abre o app de e-mail · 'whatsapp' abre o WhatsApp
  };

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const isMobile = () => window.innerWidth < 800;
  // Modo leve: no celular as animações pesadas (blur, escala/escurecer painéis, parallax) ficam de fora
  const lite = window.matchMedia('(max-width: 799px)').matches;

  const yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* =========================================================
     Texto: separa em letras / palavras
     ========================================================= */
  function splitChars(container, out = []) {
    Array.from(container.childNodes).forEach((node) => {
      if (node.nodeType === 1) {
        if (node.tagName !== 'BR') splitChars(node, out);
        return;
      }
      if (node.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const word = document.createElement('span');
        word.className = 'w';
        for (const c of part) {
          const ch = document.createElement('span');
          ch.className = 'ch';
          ch.textContent = c;
          word.appendChild(ch);
          out.push(ch);
        }
        frag.appendChild(word);
      });
      node.replaceWith(frag);
    });
    return out;
  }

  function splitWords(container, out = []) {
    Array.from(container.childNodes).forEach((node) => {
      if (node.nodeType === 1) {
        if (node.tagName !== 'BR') splitWords(node, out);
        return;
      }
      if (node.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span');
        w.className = 'word';
        w.textContent = part;
        frag.appendChild(w);
        out.push(w);
      });
      node.replaceWith(frag);
    });
    return out;
  }

  // Título grande: camada de contorno (ghost) + camada preenchida (fill)
  function setupTitle(el) {
    const html = el.innerHTML.trim();
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    el.textContent = '';

    const fill = document.createElement('span');
    fill.className = 'big-title__fill fit-inner';
    fill.setAttribute('aria-hidden', 'true');
    fill.innerHTML = html;
    const chars = splitChars(fill);

    const ghost = document.createElement('span');
    ghost.className = 'big-title__ghost';
    ghost.innerHTML = html;
    splitChars(ghost);

    fill.appendChild(ghost);
    el.appendChild(fill);
    return { el, chars, ghost };
  }

  // Ajusta o tamanho da fonte para caber na largura (ou preencher)
  function fit(el) {
    const inner = $('.fit-inner', el);
    if (!inner) return;
    el.style.fontSize = '';
    const cs = getComputedStyle(el);
    const base = parseFloat(cs.fontSize);
    const avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const w = inner.offsetWidth;
    if (!w || !avail) return;
    const max = parseFloat(el.dataset.fitMax) || Infinity;
    let size = base;
    if (el.dataset.fit === 'fill') size = Math.min(max, (base * avail) / w);
    else if (w > avail) size = (base * avail) / w;
    el.style.fontSize = `${size.toFixed(2)}px`;
    if (el.dataset.fitVar) root.style.setProperty(el.dataset.fitVar, `${size.toFixed(2)}px`);
  }
  const fitAll = () => $$('[data-fit]').forEach(fit);

  /* =========================================================
     Painéis empilhados (sticky)
     ========================================================= */
  const panels = $$('.page > .panel');
  function setStick() {
    const vh = root.clientHeight;
    panels.forEach((p) => {
      const h = p.offsetHeight;
      p.style.setProperty('--stick', `${Math.min(0, vh - h)}px`);
      // origem do "afastar" = centro da parte visível quando o painel gruda
      p.style.transformOrigin = `50% ${Math.max(h / 2, h - vh / 2)}px`;
    });
  }

  // Posição real de um elemento, ignorando o sticky
  function naturalTop(el) {
    root.classList.add('measuring');
    const y = el.getBoundingClientRect().top + window.scrollY;
    root.classList.remove('measuring');
    return Math.max(0, y);
  }

  /* =========================================================
     Prepara o texto antes de animar
     ========================================================= */
  const nameInner = $('.hero__name-inner');
  const nameChars = nameInner ? splitChars(nameInner) : [];
  const titles = $$('[data-title]').map(setupTitle);
  const wordGroups = $$('[data-words]').map((el) => ({ el, words: splitWords(el) }));

  fitAll();
  setStick();
  root.classList.add('js-stack');

  /* =========================================================
     Menu, âncoras e formulário (funcionam mesmo sem GSAP)
     ========================================================= */
  let lenis = null;
  let menuOpen = false;
  const nav = $('#nav');
  const toggle = $('.nav__toggle');
  const menu = $('#menu');

  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Fechar' : 'Menu';
    nav.classList.remove('is-hidden');
    if (lenis) (open ? lenis.stop() : lenis.start());
    if (open && hasGSAP && !reduceMotion) {
      gsap.fromTo('.menu__links a', { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.06, ease: 'expo.out', delay: 0.2 });
    }
  }
  if (toggle && menu) {
    toggle.addEventListener('click', () => setMenu(!menuOpen));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuOpen) { setMenu(false); toggle.focus(); }
    });
  }

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (menuOpen) setMenu(false);
      const y = id === '#inicio' ? 0 : naturalTop(target);
      if (lenis) lenis.scrollTo(y, { duration: 1.6 });
      else window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (id !== '#inicio') {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });

  const form = $('#form-contato');
  if (form) {
    const status = $('.form__status', form);
    const val = (n) => (form.elements[n] ? form.elements[n].value.trim() : '');
    const rules = {
      nome: (v) => v.length > 1,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      mensagem: (v) => v.length > 2,
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const invalid = Object.keys(rules).filter((n) => !rules[n](val(n)));
      Object.keys(rules).forEach((n) => form.elements[n].closest('.field').classList.toggle('is-invalid', invalid.includes(n)));
      if (invalid.length) {
        status.textContent = 'Preencha nome, um e-mail válido e a mensagem 🙂';
        form.elements[invalid[0]].focus();
        return;
      }
      const tel = val('telefone');
      const texto = `Olá, Leandro! Aqui é ${val('nome')}.\n\n${val('mensagem')}\n\nE-mail: ${val('email')}${tel ? `\nTelefone: ${tel}` : ''}`;
      if (CONTATO.enviarPor === 'whatsapp') {
        window.open(`https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
        status.textContent = 'Abrindo o WhatsApp com a sua mensagem…';
      } else {
        const assunto = `Contato pelo portfólio: ${val('nome')}`;
        window.location.href = `mailto:${CONTATO.email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(texto)}`;
        status.textContent = 'Abrindo o seu app de e-mail com a mensagem pronta…';
      }
      form.reset();
    });
    form.addEventListener('input', (e) => {
      const f = e.target.closest('.field');
      if (f) f.classList.remove('is-invalid');
    });
  }

  /* =========================================================
     Personagem: a cabeça vira e os olhos seguem o mouse (+ piscadas)
     ========================================================= */
  function setupPersonagem() {
    const avatar = $('.avatar');
    const turn = $('.character__turn');
    const hero = $('.hero');
    if (!avatar || !turn || !hero) return null;

    // Medidas em px da imagem original: posição neutra (olhando para você) e alcance de cada íris
    const OLHOS = [
      { el: $('.eye--esq'), size: 122, neutroX: -23, neutroY: 12, alcanceX: 34, cima: 16, baixo: 16 },
      { el: $('.eye--dir'), size: 112, neutroX: 18, neutroY: 12, alcanceX: 32, cima: 15, baixo: 15 },
    ].filter((o) => o.el).map((o) => ({ ...o, iris: $('.eye__iris', o.el), lid: $('.eye__lid', o.el) }));

    const alvo = { x: 0, y: 0 };   // para onde ele quer olhar (-1 a 1)
    const olho = { x: 0, y: 0 };   // olhos: chegam rápido
    const cabeca = { x: 0, y: 0 }; // cabeça: vem atrás, mais devagar
    let ultimoMovimento = performance.now();
    let proximoOlhar = 0;
    let ativo = true;

    function render() {
      OLHOS.forEach((o) => {
        const dx = o.neutroX + olho.x * o.alcanceX;
        const dy = o.neutroY + (olho.y < 0 ? olho.y * o.cima : olho.y * o.baixo);
        o.iris.style.transform = `translate3d(${((dx / o.size) * 100).toFixed(2)}%, ${((dy / o.size) * 100).toFixed(2)}%, 0)`;
      });
      turn.style.transform = `perspective(1100px) translate3d(${(cabeca.x * 16).toFixed(2)}px, ${(cabeca.y * 8).toFixed(2)}px, 0) rotateY(${(cabeca.x * 17).toFixed(2)}deg) rotateX(${(-cabeca.y * 11).toFixed(2)}deg) rotateZ(${(-cabeca.x * 2).toFixed(2)}deg)`;
    }

    function olharPara(px, py) {
      const r = avatar.getBoundingClientRect();
      const dx = px - (r.left + r.width * 0.5);
      const dy = py - (r.top + r.height * 0.58);
      const dist = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, dist / Math.max(r.width * 0.85, 240));
      alvo.x = (dx / dist) * k;
      alvo.y = (dy / dist) * k;
    }

    // Mouse parado (ou celular sem toque): ele dá umas olhadas sozinho
    function olharSozinho(t) {
      if (t < proximoOlhar) return;
      const centro = Math.random() < 0.45;
      alvo.x = centro ? 0 : (Math.random() * 2 - 1) * 0.8;
      alvo.y = centro ? 0 : (Math.random() * 2 - 1) * 0.5;
      proximoOlhar = t + 1400 + Math.random() * 2200;
    }

    function piscar() {
      OLHOS.forEach((o) => o.lid.animate(
        [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)', offset: 0.45 }, { transform: 'scaleY(1)', offset: 0.6 }, { transform: 'scaleY(0)' }],
        { duration: 190, easing: 'ease-in-out' },
      ));
    }
    function agendarPiscada() {
      setTimeout(() => {
        if (ativo && !document.hidden) {
          piscar();
          if (Math.random() < 0.18) setTimeout(piscar, 260);
        }
        agendarPiscada();
      }, 2200 + Math.random() * 3600);
    }

    let antes = performance.now();
    function loop(t) {
      const dt = Math.min(64, t - antes) / 16.67;
      antes = t;
      if (ativo) {
        if (t - ultimoMovimento > 2600) olharSozinho(t);
        const kOlho = 1 - Math.pow(1 - 0.22, dt);
        const kCabeca = 1 - Math.pow(1 - 0.065, dt);
        olho.x += (alvo.x - olho.x) * kOlho;
        olho.y += (alvo.y - olho.y) * kOlho;
        cabeca.x += (alvo.x - cabeca.x) * kCabeca;
        cabeca.y += (alvo.y - cabeca.y) * kCabeca;
        render();
      }
      requestAnimationFrame(loop);
    }

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      ultimoMovimento = performance.now();
      olharPara(e.clientX, e.clientY);
    }, { passive: true });
    const toque = (e) => {
      const p = e.touches[0];
      if (!p) return;
      ultimoMovimento = performance.now();
      olharPara(p.clientX, p.clientY);
    };
    hero.addEventListener('touchstart', toque, { passive: true });
    hero.addEventListener('touchmove', toque, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { ultimoMovimento = 0; });

    // Só anima enquanto a Hero está na tela
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { ativo = en.isIntersecting; }, { threshold: 0 }).observe(hero);
    }

    render();
    if (!reduceMotion) {
      requestAnimationFrame(loop);
      agendarPiscada();
    }

    return {
      // Abertura: começa olhando para baixo e "percebe" você
      intro() {
        if (reduceMotion) return;
        Object.assign(alvo, { x: -0.55, y: 0.75 });
        Object.assign(olho, alvo);
        Object.assign(cabeca, alvo);
        ultimoMovimento = performance.now() + 1800;
        render();
        setTimeout(() => {
          if (performance.now() - ultimoMovimento < 0) Object.assign(alvo, { x: 0, y: 0 });
          setTimeout(piscar, 350);
        }, 1250);
      },
    };
  }
  const personagem = setupPersonagem();

  /* =========================================================
     Experiência: pilha de itens (como no site da Stutz)
     Cada item gruda logo abaixo da faixa "número + empresa" do de cima;
     o número encolhe e o texto apaga conforme o próximo cobre.
     ========================================================= */
  const expRows = $$('.exp');
  const expList = $('.exp-list');
  const expSobra = $('.exp-sobra');
  let pilha = null;
  function medirPilha() {
    if (!expRows.length || !expList) return;
    const navH = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 64;
    let topo = navH + 10;
    if (lite) expRows.forEach((r) => { r.style.minHeight = ''; });
    const itens = expRows.map((row) => {
      const num = $('.exp__num', row);
      const top = $('.exp__top', row);
      const body = $('.exp__body', row);
      const ladoALado = num.offsetLeft + num.offsetWidth <= body.offsetLeft;
      const D = Math.round(top.offsetTop + top.offsetHeight + (ladoALado ? 18 : 14));
      const escala = ladoALado ? Math.min(1, Math.max(0.3, (D - num.offsetTop - 8) / num.offsetHeight)) : 1;
      row.style.setProperty('--escala-min', escala.toFixed(3));
      row.style.setProperty('--stack-top', `${topo}px`);
      const item = { row, D, H: row.offsetHeight, T: row.offsetTop, S: topo };
      topo += D;
      return item;
    });
    // Celular (sticky nativo): todos os itens terminam na mesma linha, para subirem juntos no fim
    if (lite) {
      const K = Math.max(...itens.map((p) => p.S + p.H));
      itens.forEach((p) => { p.row.style.minHeight = `${Math.ceil(K - p.S)}px`; });
    }
    // O fundo final cobre o que sobra de cada item, para a pilha fechar inteira
    const cobrir = Math.max(0, ...itens.map((p) => p.S + p.H - topo));
    // e precisa ir até o fim da tela, para a próxima seção só chegar com a pilha já fechada
    if (expSobra) expSobra.style.setProperty("--sobra", `${Math.ceil(Math.max(cobrir + 24, root.clientHeight - topo + 24))}px`);
    const fim = expSobra ? expSobra.offsetTop : expList.offsetHeight;
    pilha = { itens, fim, fechada: topo - fim };
  }
  // Cada item "gruda" (via transform) embaixo das faixas de cima; depois de fechada, a pilha sobe inteira
  function aplicarPilha() {
    if (!pilha) return;
    if (lite) {
      const { itens } = pilha;
      itens.forEach((p, i) => {
        const a = p.row.getBoundingClientRect().top;
        const b = (i < itens.length - 1 ? itens[i + 1].row : expSobra).getBoundingClientRect().top;
        const v = Math.min(1, Math.max(0, (b - a - p.D) / Math.max(1, p.H - p.D)));
        p.row.style.setProperty('--visivel', v.toFixed(3));
      });
      return;
    }
    const Lreal = expList.getBoundingClientRect().top;
    const L = Math.max(Lreal, pilha.fechada);
    const { itens } = pilha;
    const desloca = itens.map((p) => Math.max(0, p.S - L - p.T));
    itens.forEach((p, i) => {
      const atual = Lreal + p.T + desloca[i];
      const prox = i < itens.length - 1 ? Lreal + itens[i + 1].T + desloca[i + 1] : Lreal + pilha.fim;
      const v = Math.min(1, Math.max(0, (prox - atual - p.D) / Math.max(1, p.H - p.D)));
      p.row.style.transform = desloca[i] ? `translate3d(0, ${desloca[i].toFixed(1)}px, 0)` : '';
      p.row.style.setProperty('--visivel', v.toFixed(3));
    });
  }
  let pilhaPendente = false;
  window.addEventListener('scroll', () => {
    if (pilhaPendente) return;
    pilhaPendente = true;
    requestAnimationFrame(() => { pilhaPendente = false; aplicarPilha(); });
  }, { passive: true });
  medirPilha();
  aplicarPilha();
  setStick();

  /* ---------- Sem GSAP (CDN fora do ar): mostra tudo e para aqui ---------- */
  if (!hasGSAP) {
    root.classList.remove('is-loading');
    $$('.exp').forEach((r) => r.classList.add('is-active'));
    window.addEventListener('resize', () => { fitAll(); setStick(); medirPilha(); aplicarPilha(); });
    return;
  }

  /* =========================================================
     GSAP + Lenis
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  if (!reduceMotion && window.Lenis && canHover && !lite) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Antes de recalcular as posições: tira o sticky, reajusta fontes e alturas
  ScrollTrigger.addEventListener('refreshInit', () => {
    root.classList.add('measuring');
    fitAll();
    medirPilha();
    setStick();
  });
  ScrollTrigger.addEventListener('refresh', () => { root.classList.remove('measuring'); aplicarPilha(); });

  /* ---------- Movimento reduzido: só o essencial ---------- */
  if (reduceMotion) {
    root.classList.remove('is-loading');
    $$('.exp').forEach((r) => r.classList.add('is-active'));
    titles.forEach(({ ghost }) => gsap.set(ghost, { opacity: 0 }));
    setupNavLinks();
    window.addEventListener('load', () => ScrollTrigger.refresh());
    return;
  }

  /* =========================================================
     1. Abertura
     ========================================================= */
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 });
  intro
    .from('.hero__light', { opacity: 0, scale: 1.3, duration: 2.2, ease: 'power2.out' }, 0)
    .from(nameChars, { yPercent: 115, rotate: 6, opacity: 0, duration: 1.3, stagger: 0.035 }, 0.05)
    .from('.character__pop', { yPercent: 30, scale: 0.72, opacity: 0, duration: 1.8, ease: 'elastic.out(1, 0.7)' }, 0.3)
    .from('.hero__line > span', { yPercent: 110, duration: 1.3, stagger: 0.1 }, 0.35)
    .from('.hero__pill, .hero__right > *', { y: 26, opacity: 0, duration: 1.1, stagger: 0.08 }, 0.7)
    .from('.nav__brand, .nav__links a, .nav__toggle', { y: -22, opacity: 0, duration: 1, stagger: 0.05 }, 0.5);
  root.classList.remove('is-loading');
  if (personagem) personagem.intro();

  /* =========================================================
     2. Personagem: flutua de leve e acompanha a rolagem
     ========================================================= */
  gsap.to('.character__float', { y: -14, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__name', { yPercent: -30, opacity: 0.2, ease: 'none' }, 0)
    .to('.character', { yPercent: 14, scale: 0.9, ease: 'none' }, 0)
    .to('.hero__bottom', { y: -70, opacity: 0, ease: 'none' }, 0)
    .to('.hero__light', { opacity: 0.35, ease: 'none' }, 0);

  /* =========================================================
     3. Faixas que correm (ferramentas e formação)
     ========================================================= */
  const marquees = [];
  const cloneItem = (li) => {
    const c = li.cloneNode(true);
    c.classList.add('is-clone');
    c.setAttribute('aria-hidden', 'true');
    return c;
  };
  $$('[data-marquee]').forEach((m) => {
    const track = $('.marquee__track', m);
    const originals = Array.from(track.children);
    let guard = 0;
    while (track.scrollWidth < window.innerWidth * 1.3 && guard++ < 8) {
      originals.forEach((li) => track.appendChild(cloneItem(li)));
    }
    Array.from(track.children).forEach((li) => track.appendChild(cloneItem(li)));

    const dir = Number(m.dataset.dir || -1);
    const tween = gsap.fromTo(track,
      { xPercent: dir < 0 ? 0 : -50 },
      { xPercent: dir < 0 ? -50 : 0, duration: Number(m.dataset.speed || 40), ease: 'none', repeat: -1 });
    const mq = { m, tween, hover: false, cards: m.classList.contains('marquee--cards') };
    marquees.push(mq);

    if (m.hasAttribute('data-pause') && canHover) {
      m.addEventListener('pointerenter', () => { mq.hover = true; gsap.to(tween, { timeScale: 0, duration: 0.6, overwrite: true }); });
      m.addEventListener('pointerleave', () => { mq.hover = false; gsap.to(tween, { timeScale: 1, duration: 0.6, overwrite: true }); });
    }
  });

  // No celular os cards de formação viram carrossel de arrastar (sem animação)
  const mm = gsap.matchMedia();
  mm.add('(max-width: 799px)', () => {
    const fileiras = marquees.filter((q) => q.cards);
    fileiras.forEach((q) => { q.tween.pause(); gsap.set($('.marquee__track', q.m), { xPercent: 0 }); });
    // de cima vai para a direita, de baixo para a esquerda; percorre todos os cards
    fileiras.forEach((q, i) => {
      const track = $('.marquee__track', q.m);
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth + 32);
      gsap.fromTo(track, { x: () => (i === 0 ? -dist() + 16 : 16) }, {
        x: () => (i === 0 ? 16 : -dist() + 16),
        ease: 'none',
        scrollTrigger: { trigger: '.education__rows', start: 'top 90%', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      });
    });
    return () => fileiras.forEach((q) => q.tween.play());
  });

  // Acelera as faixas conforme a velocidade da rolagem + esconde o menu ao descer
  let slowDown;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      if (!lite) {
        const ts = 1 + Math.min(Math.abs(self.getVelocity()) / 350, 5);
        marquees.forEach((q) => { if (!q.hover) gsap.to(q.tween, { timeScale: ts, duration: 0.25, overwrite: true }); });
        clearTimeout(slowDown);
        slowDown = setTimeout(() => {
          marquees.forEach((q) => { if (!q.hover) gsap.to(q.tween, { timeScale: 1, duration: 1.2, ease: 'power2.out', overwrite: true }); });
        }, 140);
      }
      if (!menuOpen) nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 160);
    },
  });

  /* =========================================================
     4. Galeria: fileiras em sentidos opostos
     ========================================================= */
  $$('.gallery__row').forEach((row, i) => {
    const left = i % 2 === 0;
    const dist = () => Math.max(0, row.scrollWidth - window.innerWidth) * 0.6;
    gsap.fromTo(row,
      { x: () => (left ? 0 : -dist()) },
      {
        x: () => (left ? -dist() : 0),
        ease: 'none',
        scrollTrigger: { trigger: '.gallery', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      });
  });

  /* =========================================================
     5. Títulos: contorno → preenchido, letra por letra
     ========================================================= */
  titles.forEach(({ el, chars, ghost }) => {
    if (lite) {
      gsap.fromTo(chars, { opacity: 0, yPercent: 45 }, {
        opacity: 1, yPercent: 0, duration: 0.9, stagger: 0.035, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
      gsap.to(ghost, { opacity: 0, duration: 0.5, delay: 0.5, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      return;
    }
    gsap.fromTo(chars,
      { opacity: 0, yPercent: 40, scale: 1.3, filter: 'blur(14px)' },
      {
        opacity: 1, yPercent: 0, scale: 1, filter: 'blur(0px)', ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 45%', scrub: true },
      });
    gsap.to(ghost, { opacity: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top 50%', end: 'top 38%', scrub: true } });
  });

  // Parágrafos: palavras acendem conforme a rolagem
  wordGroups.forEach(({ el, words }) => {
    if (lite) {
      gsap.fromTo(words, { opacity: 0.13 }, { opacity: 1, duration: 0.5, stagger: 0.025, ease: 'none', scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
      return;
    }
    gsap.fromTo(words, { opacity: 0.13 }, {
      opacity: 1, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 86%', end: 'bottom 62%', scrub: true },
    });
  });

  /* =========================================================
     6. Objetos 3D: entram com mola, flutuam e fazem parallax
     ========================================================= */
  $$('.float').forEach((f, i) => {
    const img = $('img', f);
    const speed = Number(f.dataset.speed || 1);
    const area = f.closest('section, .panel') || f.parentElement;
    gsap.to(img, {
      y: gsap.utils.random(-24, -10), rotation: gsap.utils.random(-10, 10),
      duration: gsap.utils.random(2.4, 3.8), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.15,
    });
    gsap.from(f, {
      scale: 0, rotation: gsap.utils.random(-60, 60), opacity: 0, duration: 1.4, ease: 'back.out(1.7)',
      scrollTrigger: { trigger: f, start: 'top 94%', toggleActions: 'play none none reverse' },
    });
    if (!lite) gsap.fromTo(f, { yPercent: 60 * speed }, {
      yPercent: -60 * speed, ease: 'none',
      scrollTrigger: { trigger: area, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* =========================================================
     7. Sobre: botões e números
     ========================================================= */
  gsap.from('.about__actions .btn', {
    y: 30, opacity: 0, duration: 1, stagger: 0.1, ease: 'expo.out',
    scrollTrigger: { trigger: '.about__actions', start: 'top 92%' },
  });
  gsap.from('.stat', {
    y: 50, opacity: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out',
    scrollTrigger: { trigger: '.stats', start: 'top 90%' },
  });
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, {
      v: end, duration: 1.8, ease: 'power3.out',
      onUpdate: () => { el.textContent = String(Math.round(o.v)); },
      scrollTrigger: { trigger: el, start: 'top 92%' },
    });
  });

  /* =========================================================
     8. Painéis: o de baixo afasta e escurece quando o próximo cobre
     ========================================================= */
  panels.forEach((p, i) => {
    const next = panels[i + 1];
    if (!next || lite) return;
    const last = i === panels.length - 2; // contato → rodapé
    gsap.fromTo(p, { '--cover': 0, scale: 1 }, {
      '--cover': last ? 0.55 : 1,
      scale: last ? 0.97 : 0.94,
      ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: last ? 'bottom bottom' : 'top top', scrub: true },
    });
  });

  /* ---------- Projetos: cards empilham e o de trás afasta ---------- */
  const cards = $$('.pcard');
  const navH = () => parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 64;
  cards.forEach((card, i) => {
    if (lite) return;
    gsap.fromTo($$('img', card), { scale: 1.16 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 30%', scrub: true },
    });
    const next = cards[i + 1] || $('.pcards__fim');
    if (!next) return;
    gsap.fromTo(card, { scale: 1, '--cover': 0 }, {
      scale: 0.93, '--cover': 1, ease: 'none',
      scrollTrigger: {
        trigger: next,
        start: 'top bottom',
        end: () => `top ${navH() + (isMobile() ? 8 : 12) + (i + 1) * (isMobile() ? 10 : 16)}px`,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  });

  /* ---------- Stutz Web ---------- */
  gsap.fromTo('.browser', { rotationX: 26, rotationY: -26, rotationZ: 2, y: 80, scale: 0.9, transformPerspective: 1400 }, {
    rotationX: 7, rotationY: -12, rotationZ: 1.5, y: 0, scale: 1, transformPerspective: 1400, ease: 'none',
    scrollTrigger: { trigger: '.stutz__visual', start: 'top 98%', end: 'top 35%', scrub: true },
  });
  gsap.from('.stutz__copy > :not(.big-title)', {
    y: 36, opacity: 0, duration: 1.1, stagger: 0.09, ease: 'expo.out',
    scrollTrigger: { trigger: '.stutz__copy', start: 'top 75%' },
  });
  gsap.from('.stutz__logo', {
    y: 40, opacity: 0, rotate: -6, duration: 1.2, ease: 'back.out(1.6)',
    scrollTrigger: { trigger: '.stutz__visual', start: 'top 60%' },
  });
  gsap.set('.service', { opacity: 0, y: 90, scale: 0.92, rotationX: -14, transformPerspective: 900, transformOrigin: '50% 100%' });
  gsap.set('.service img', { scale: 0, rotation: -35 });
  ScrollTrigger.batch('.service', {
    start: 'top 92%',
    once: true,
    onEnter: (els) => {
      gsap.to(els, { opacity: 1, y: 0, scale: 1, rotationX: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out', overwrite: true });
      gsap.to(els.map((el) => $('img', el)), { scale: 1, rotation: 0, duration: 1.1, stagger: 0.12, delay: 0.2, ease: 'back.out(2)' });
    },
  });

  /* ---------- Formação ---------- */
  gsap.from('.education__rows', {
    y: 60, opacity: 0, duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: '.education__rows', start: 'top 90%' },
  });
  // Habilidades: título sobe, cada card entra quando chega na tela e as tags pulam uma a uma
  gsap.from('.skills__title', {
    yPercent: 120, opacity: 0, letterSpacing: '0.2em', duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: '.skills__title', start: 'top 90%' },
  });
  gsap.set('.skill', { opacity: 0, y: 60, scale: 0.94, rotationX: -18, transformPerspective: 900, transformOrigin: '50% 0%' });
  gsap.set('.skill h4', { opacity: 0, x: -20 });
  gsap.set('.skill li', { opacity: 0, y: 14, scale: 0.8 });
  ScrollTrigger.batch('.skill', {
    start: 'top 92%',
    once: true,
    onEnter: (els) => els.forEach((el, i) => {
      gsap.timeline({ delay: i * 0.1, defaults: { ease: 'expo.out' } })
        .to(el, { opacity: 1, y: 0, scale: 1, rotationX: 0, duration: 1.1 })
        .to($('h4', el), { opacity: 1, x: 0, duration: 0.8 }, 0.25)
        .to($$('li', el), { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.06, ease: 'back.out(2.2)' }, 0.35);
    }),
  });

  /* ---------- Contato ---------- */
  gsap.from('.contact__copy > :not(.big-title)', {
    y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out',
    scrollTrigger: { trigger: '.contact__copy', start: 'top 70%' },
  });
  gsap.from('.form > *', {
    y: 30, opacity: 0, duration: 1, stagger: 0.07, ease: 'expo.out',
    scrollTrigger: { trigger: '.form', start: 'top 85%' },
  });

  /* ---------- Rodapé ---------- */
  gsap.from('.footer__name span', {
    yPercent: 70, opacity: 0, duration: 1.3, stagger: 0.1, ease: 'expo.out',
    scrollTrigger: { trigger: '.footer', start: 'top 85%' },
  });
  gsap.from('.shape', {
    yPercent: 120, rotation: -120, scale: 0.3, opacity: 0, duration: 1.4, stagger: 0.07, ease: 'back.out(1.6)',
    scrollTrigger: { trigger: '.shapes', start: 'top 96%' },
  });

  /* ---------- Link ativo no menu ---------- */
  function setupNavLinks() {
    $$('.nav__links a').forEach((a) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      ScrollTrigger.create({
        trigger: target, start: 'top 55%', end: 'bottom 55%',
        onToggle: (s) => a.classList.toggle('is-active', s.isActive),
      });
    });
  }
  setupNavLinks();

  /* ---------- Recalcula quando fontes e imagens terminam de carregar ---------- */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
