(function () {
  if (window.__twLuxuryV2Loaded) return;
  window.__twLuxuryV2Loaded = true;

  var doc = document;
  var win = window;
  var body = doc.body;
  if (!body) return;

  var prefersReducedMotion = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IS_TOUCH = ('ontouchstart' in win) || (navigator.maxTouchPoints > 0);
  var state = {
    lenis: null,
    gsap: null,
    scrollTrigger: null,
    links: [],
    pointer: { x: win.innerWidth * 0.5, y: win.innerHeight * 0.5 },
    commandOpen: false,
    activeIndex: -1
  };

  var DEFAULT_LINKS = [
    { icon: '🏠', title: 'Home', note: 'Main landing', href: 'index.html' },
    { icon: '🛍️', title: 'Shop all', note: 'Complete catalog', href: 'shop.html' },
    { icon: '🧥', title: 'Jackets', note: 'Premium outerwear', href: 'shop.html?cat=jackets' },
    { icon: '🧴', title: 'Cologne', note: 'Signature scents', href: 'shop.html?cat=cologne' },
    { icon: '🎽', title: 'Clothing', note: 'Core apparel', href: 'shop.html?cat=clothing' },
    { icon: '🎒', title: 'Accessories', note: 'Final details', href: 'shop.html?cat=accessories' },
    { icon: '✨', title: 'Collections', note: 'Curated drops', href: 'collections.html' },
    { icon: '🛒', title: 'Cart', note: 'Checkout ready', href: 'cart.html' },
    { icon: '💖', title: 'Wishlist', note: 'Saved picks', href: 'wishlist.html' },
    { icon: '📦', title: 'Order tracking', note: 'Delivery status', href: 'order-tracking.html' },
    { icon: '📏', title: 'Size guide', note: 'Find your fit', href: 'size-guide.html' },
    { icon: '❓', title: 'FAQ', note: 'Quick support', href: 'faq.html' },
    { icon: '🚚', title: 'Shipping', note: 'Delivery policy', href: 'shipping.html' },
    { icon: '↩️', title: 'Returns', note: 'Easy exchanges', href: 'returns.html' },
    { icon: '🧼', title: 'Care guide', note: 'Product care', href: 'care-guide.html' },
    { icon: '📞', title: 'Contact', note: 'Talk to support', href: 'contact.html' },
    { icon: '🏁', title: 'About', note: 'Brand story', href: 'about.html' }
  ];

  body.classList.add('twlx-on');

  function el(tag, cls, text) {
    var node = doc.createElement(tag);
    if (cls) node.className = cls;
    if (typeof text === 'string') node.textContent = text;
    return node;
  }

  function isSafeHref(href) {
    var value = String(href || '').trim();
    if (!value) return null;
    if (value.charAt(0) === '#') return value;
    var low = value.toLowerCase();
    if (low.indexOf('javascript:') === 0 || low.indexOf('data:') === 0 || low.indexOf('vbscript:') === 0 || low.indexOf('file:') === 0) {
      return null;
    }
    try {
      var parsed = new URL(value, win.location.href);
      var p = (parsed.protocol || '').toLowerCase();
      if (p === 'http:' || p === 'https:' || p === 'mailto:' || p === 'tel:') return parsed.href;
      return null;
    } catch (e) {
      return null;
    }
  }

  function isInternalHref(href) {
    try {
      var u = new URL(href, win.location.href);
      return u.origin === win.location.origin;
    } catch (e) {
      return false;
    }
  }

  function dedupeLinks(items) {
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < items.length; i += 1) {
      var row = items[i] || {};
      var href = isSafeHref(row.href);
      if (!href) continue;
      var title = String(row.title || '').trim();
      if (!title) continue;
      if (title.length > 70) continue;
      var key = title.toLowerCase() + '|' + href.toLowerCase();
      if (seen[key]) continue;
      seen[key] = 1;
      out.push({
        icon: row.icon || '🔗',
        title: title,
        note: String(row.note || 'Page link').trim() || 'Page link',
        href: href
      });
    }
    return out;
  }

  function gatherAnchors() {
    var found = [];
    var all = doc.querySelectorAll('a[href]');
    var max = 70;
    for (var i = 0; i < all.length && found.length < max; i += 1) {
      var a = all[i];
      var href = isSafeHref(a.getAttribute('href'));
      if (!href) continue;
      if (!isInternalHref(href)) continue;
      var t = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t || t.length > 64) continue;
      found.push({ icon: '🔗', title: t, note: 'Page link', href: href });
    }
    return found;
  }

  function getCurrentPath() {
    return (win.location.pathname || '').split('/').pop() || 'index.html';
  }

  function createLayers() {
    var layers = el('div', 'twlx-layers');
    layers.setAttribute('aria-hidden', 'true');
    layers.appendChild(el('div', 'twlx-grad'));
    layers.appendChild(el('div', 'twlx-noise'));
    layers.appendChild(el('div', 'twlx-vignette'));
    body.appendChild(layers);
  }

  function createProgressBar() {
    var progress = el('div', 'twlx-progress');
    progress.setAttribute('aria-hidden', 'true');
    body.appendChild(progress);
    return progress;
  }

  function createCursor() {
    if (IS_TOUCH || prefersReducedMotion) return null;
    var cursor = el('div', 'twlx-cursor');
    cursor.setAttribute('aria-hidden', 'true');
    body.appendChild(cursor);
    body.classList.add('twlx-pointer');

    win.addEventListener('pointermove', function (evt) {
      state.pointer.x = evt.clientX;
      state.pointer.y = evt.clientY;
      cursor.style.transform = 'translate3d(' + state.pointer.x + 'px,' + state.pointer.y + 'px,0)';
    }, { passive: true });

    var targets = doc.querySelectorAll('a,button,input,textarea,select,[role="button"],.product-card,.collection-card,.cat-card');
    for (var i = 0; i < targets.length; i += 1) {
      targets[i].addEventListener('pointerenter', function () { cursor.classList.add('active'); });
      targets[i].addEventListener('pointerleave', function () { cursor.classList.remove('active'); });
    }

    return cursor;
  }

  function showToast(message, delay) {
    var toast = doc.getElementById('twlxToast');
    if (!toast) {
      toast = el('div', 'twlx-toast', 'Ready');
      toast.id = 'twlxToast';
      body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    win.setTimeout(function () {
      toast.classList.remove('show');
    }, typeof delay === 'number' ? delay : 1700);
  }

  function createTopButton() {
    var topBtn = el('button', 'twlx-top', '↑');
    topBtn.type = 'button';
    topBtn.setAttribute('aria-label', 'Back to top');
    topBtn.addEventListener('click', function () {
      if (state.lenis) {
        state.lenis.scrollTo(0, { duration: 1.05 });
      } else {
        win.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
    body.appendChild(topBtn);
    return topBtn;
  }

  function collectCounts() {
    var productCount = 36;
    if (win.TWCatalog && Array.isArray(win.TWCatalog.products)) {
      productCount = win.TWCatalog.products.length;
    }
    var reviewCount = 1200;
    var rating = '4.9';
    return [
      { v: '1-click', l: 'Navigation' },
      { v: String(productCount), l: 'Products live' },
      { v: rating + '/5', l: 'Rider rating' },
      { v: '24/7', l: 'Self-service' }
    ];
  }

  function getAnchorNode() {
    var targets = [
      doc.querySelector('.hero'),
      doc.querySelector('.page-hero'),
      doc.querySelector('main section'),
      doc.querySelector('main'),
      body.firstElementChild
    ];
    for (var i = 0; i < targets.length; i += 1) {
      if (targets[i] && targets[i].parentNode) return targets[i];
    }
    return null;
  }

  function injectExperienceBlocks() {
    var anchor = getAnchorNode();
    if (!anchor || !anchor.parentNode) return;

    if (!doc.querySelector('.twlx-spot')) {
      var spot = el('section', 'twlx-spot twlx-reveal');
      var left = el('div');
      var label = el('b', null, 'Luxury experience mode');
      var title = el('h3', null, 'Smooth, premium, and fast — built for riders on desktop and mobile.');
      var p = el('p', null, 'Use the command deck for instant route jumps, enjoy fluid scroll transitions, and navigate with a focused mobile dock tuned for thumb-first shopping.');
      var chipRow = el('div', 'twlx-chip-row');
      var chips = ['Smart navigation', 'Fluid motion', 'Focused mobile UX', 'Premium interactions'];
      for (var i = 0; i < chips.length; i += 1) {
        chipRow.appendChild(el('span', 'twlx-chip', chips[i]));
      }
      left.appendChild(label);
      left.appendChild(title);
      left.appendChild(p);
      left.appendChild(chipRow);

      var right = el('div', 'twlx-kpis');
      var counts = collectCounts();
      for (var j = 0; j < counts.length; j += 1) {
        var box = el('article', 'twlx-kpi twlx-reveal');
        var strong = el('strong', null, counts[j].v);
        var span = el('span', null, counts[j].l);
        box.appendChild(strong);
        box.appendChild(span);
        right.appendChild(box);
      }

      spot.appendChild(left);
      spot.appendChild(right);
      anchor.parentNode.insertBefore(spot, anchor.nextSibling);
    }
  }

  function normalizeHrefForLink(href) {
    try {
      var u = new URL(href, win.location.href);
      if (u.origin === win.location.origin) {
        var path = u.pathname.split('/').pop() || 'index.html';
        return path + (u.search || '') + (u.hash || '');
      }
      return u.href;
    } catch (e) {
      return href;
    }
  }

  function createCommandDeck() {
    var cmdBtn = el('button', 'twlx-command-btn');
    cmdBtn.type = 'button';
    cmdBtn.setAttribute('aria-expanded', 'false');
    cmdBtn.setAttribute('aria-controls', 'twlxCommand');
    cmdBtn.innerHTML = '<b>Luxury Access</b><span class="hint">Ctrl/⌘+K</span>';

    var shell = el('section', 'twlx-command');
    shell.id = 'twlxCommand';
    shell.setAttribute('aria-label', 'Luxury command deck');

    var card = el('div', 'twlx-command-card');
    var head = el('div', 'twlx-command-head');
    var strong = el('strong', null, 'Command deck');
    var p = el('p', null, 'Search every route, jump instantly, and move through the Two Wheel experience with zero friction.');
    head.appendChild(strong);
    head.appendChild(p);

    var search = el('div', 'twlx-command-search');
    var input = el('input');
    input.type = 'search';
    input.placeholder = 'Search pages, categories, support, checkout...';
    input.setAttribute('aria-label', 'Search quick links');
    var clear = el('button', null, 'Clear');
    clear.type = 'button';
    search.appendChild(input);
    search.appendChild(clear);

    var list = el('div', 'twlx-command-list');

    card.appendChild(head);
    card.appendChild(search);
    card.appendChild(list);
    shell.appendChild(card);

    body.appendChild(cmdBtn);
    body.appendChild(shell);

    function setOpen(nextOpen) {
      state.commandOpen = nextOpen;
      shell.classList.toggle('open', nextOpen);
      cmdBtn.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
      if (nextOpen) {
        input.focus();
        input.select();
      }
    }

    function render(filter) {
      var term = String(filter || '').trim().toLowerCase();
      list.textContent = '';
      state.activeIndex = -1;
      var shown = [];

      for (var i = 0; i < state.links.length; i += 1) {
        var item = state.links[i];
        var hay = (item.title + ' ' + item.note + ' ' + item.href).toLowerCase();
        if (term && hay.indexOf(term) === -1) continue;
        shown.push(item);
      }

      if (!shown.length) {
        list.appendChild(el('div', 'twlx-command-empty', 'No matches yet — try a broader term.'));
        return;
      }

      for (var j = 0; j < shown.length; j += 1) {
        var row = shown[j];
        var a = el('a', 'twlx-command-item');
        a.href = normalizeHrefForLink(row.href);
        a.dataset.idx = String(j);
        var icon = el('span', null, row.icon || '🔗');

        var mid = el('span');
        var t = el('strong', null, row.title);
        var m = el('span', 'meta', row.note);
        mid.appendChild(t);
        mid.appendChild(doc.createElement('br'));
        mid.appendChild(m);

        var go = el('span', null, '›');
        a.appendChild(icon);
        a.appendChild(mid);
        a.appendChild(go);
        list.appendChild(a);
      }
    }

    function activateIndex(next) {
      var items = list.querySelectorAll('.twlx-command-item');
      if (!items.length) return;
      state.activeIndex = (next + items.length) % items.length;
      for (var i = 0; i < items.length; i += 1) {
        items[i].classList.toggle('active', i === state.activeIndex);
      }
      if (items[state.activeIndex]) {
        items[state.activeIndex].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }

    function submitActive() {
      var active = list.querySelector('.twlx-command-item.active');
      if (active) {
        active.click();
        return true;
      }
      var first = list.querySelector('.twlx-command-item');
      if (first) {
        first.click();
        return true;
      }
      return false;
    }

    cmdBtn.addEventListener('click', function () {
      setOpen(!state.commandOpen);
      if (state.commandOpen) showToast('Command deck ready', 1100);
    });

    clear.addEventListener('click', function () {
      input.value = '';
      render('');
      input.focus();
    });

    input.addEventListener('input', function () {
      render(input.value);
    });

    input.addEventListener('keydown', function (evt) {
      if (evt.key === 'ArrowDown') {
        evt.preventDefault();
        activateIndex(state.activeIndex + 1);
      } else if (evt.key === 'ArrowUp') {
        evt.preventDefault();
        activateIndex(state.activeIndex - 1);
      } else if (evt.key === 'Enter') {
        evt.preventDefault();
        submitActive();
      }
    });

    shell.addEventListener('click', function (evt) {
      if (evt.target === shell) {
        setOpen(false);
      }
    });

    doc.addEventListener('keydown', function (evt) {
      var activeTag = (doc.activeElement && doc.activeElement.tagName || '').toLowerCase();
      var activeInput = activeTag === 'input' || activeTag === 'textarea' || doc.activeElement && doc.activeElement.isContentEditable;
      if ((evt.ctrlKey || evt.metaKey) && (evt.key === 'k' || evt.key === 'K')) {
        evt.preventDefault();
        setOpen(true);
        return;
      }
      if (!activeInput && evt.key === '/') {
        evt.preventDefault();
        setOpen(true);
        return;
      }
      if (evt.key === 'Escape') {
        setOpen(false);
      }
    });

    render('');

    return {
      open: function () { setOpen(true); },
      close: function () { setOpen(false); },
      render: render
    };
  }

  function estimateCartCount() {
    var keys = ['twCart', 'cart', 'twoWheelCart', 'TW_CART'];
    for (var i = 0; i < keys.length; i += 1) {
      var raw = null;
      try { raw = localStorage.getItem(keys[i]); } catch (e) { raw = null; }
      if (!raw) continue;
      try {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          var sum = 0;
          for (var j = 0; j < parsed.length; j += 1) {
            var item = parsed[j] || {};
            var q = Number(item.qty || item.quantity || 1);
            sum += Number.isFinite(q) && q > 0 ? q : 1;
          }
          if (sum > 0) return sum;
        } else if (parsed && typeof parsed === 'object') {
          var s = 0;
          var vals = Object.keys(parsed);
          for (var k = 0; k < vals.length; k += 1) {
            var v = parsed[vals[k]];
            if (v && typeof v === 'object') {
              var q2 = Number(v.qty || v.quantity || 1);
              s += Number.isFinite(q2) && q2 > 0 ? q2 : 1;
            }
          }
          if (s > 0) return s;
        }
      } catch (e2) {
      }
    }

    var badges = doc.querySelectorAll('#cartBadge, #mobCartBadge, .cart-badge, .mob-cart-badge');
    for (var m = 0; m < badges.length; m += 1) {
      var n = Number((badges[m].textContent || '').replace(/[^0-9.]/g, ''));
      if (Number.isFinite(n) && n > 0) return n;
    }

    return 0;
  }

  function createMobileDock(commandDeck) {
    var dock = el('nav', 'twlx-mobile-dock');
    dock.setAttribute('aria-label', 'Quick mobile navigation');

    var current = getCurrentPath();

    function makeLink(href, label, emoji) {
      var a = el('a');
      a.href = href;
      a.innerHTML = '<span>' + emoji + '</span><small>' + label + '</small>';
      if (current === href.split('?')[0]) a.classList.add('is-active');
      return a;
    }

    var home = makeLink('index.html', 'Home', '🏠');
    var shop = makeLink('shop.html', 'Shop', '🛍️');
    var cart = makeLink('cart.html', 'Cart', '🛒');

    var searchBtn = el('button');
    searchBtn.type = 'button';
    searchBtn.innerHTML = '<span>⌕</span><small>Search</small>';
    searchBtn.addEventListener('click', function () {
      if (commandDeck) commandDeck.open();
    });

    var topBtn = el('button');
    topBtn.type = 'button';
    topBtn.innerHTML = '<span>↑</span><small>Top</small>';
    topBtn.addEventListener('click', function () {
      if (state.lenis) state.lenis.scrollTo(0, { duration: 0.95 });
      else win.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    dock.appendChild(home);
    dock.appendChild(shop);
    dock.appendChild(searchBtn);
    dock.appendChild(cart);
    dock.appendChild(topBtn);

    body.appendChild(dock);

    function updateCartLabel() {
      var count = estimateCartCount();
      var small = cart.querySelector('small');
      if (small) small.textContent = count > 0 ? 'Cart ' + count : 'Cart';
    }

    updateCartLabel();
    win.setInterval(updateCartLabel, 1800);
  }

  function markRevealTargets() {
    var nodes = doc.querySelectorAll(
      '.hero, .page-hero, .card, .product-card, .collection-card, .cat-card, .faq-item, .testimonial-card, .story, .summary, .box, .panel, section'
    );
    for (var i = 0; i < nodes.length; i += 1) {
      if (!nodes[i].classList.contains('twlx-reveal')) {
        nodes[i].classList.add('twlx-reveal');
      }
    }
  }

  function attachRevealObserver() {
    var targets = doc.querySelectorAll('.twlx-reveal');
    if (!targets.length) return;

    if ('IntersectionObserver' in win) {
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i += 1) {
          var entry = entries[i];
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        }
      }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

      for (var j = 0; j < targets.length; j += 1) {
        io.observe(targets[j]);
      }
    } else {
      for (var k = 0; k < targets.length; k += 1) {
        targets[k].classList.add('in');
      }
    }
  }

  function setupMagneticButtons() {
    if (IS_TOUCH || prefersReducedMotion) return;
    var items = doc.querySelectorAll('.btn-primary, .btn-outline, .cart-btn, .product-quick-add, .twlx-command-btn');
    for (var i = 0; i < items.length; i += 1) {
      var btn = items[i];
      btn.classList.add('twlx-magnetic');

      btn.addEventListener('pointermove', function (evt) {
        var rect = this.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (evt.clientX - cx) / Math.max(rect.width, 1);
        var dy = (evt.clientY - cy) / Math.max(rect.height, 1);
        this.style.transform = 'translate(' + (dx * 8).toFixed(2) + 'px,' + (dy * 8).toFixed(2) + 'px)';
      });

      btn.addEventListener('pointerleave', function () {
        this.style.transform = '';
      });
    }
  }

  function setupCardTilt() {
    if (IS_TOUCH || prefersReducedMotion) return;
    var cards = doc.querySelectorAll('.product-card, .collection-card, .cat-card, .testimonial-card, .brand-stat-card');
    for (var i = 0; i < cards.length; i += 1) {
      var card = cards[i];
      card.classList.add('twlx-parallax');

      card.addEventListener('pointermove', function (evt) {
        var rect = this.getBoundingClientRect();
        var px = (evt.clientX - rect.left) / rect.width;
        var py = (evt.clientY - rect.top) / rect.height;
        var rx = (0.5 - py) * 6;
        var ry = (px - 0.5) * 8;
        this.style.transform = 'translateY(-6px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      });

      card.addEventListener('pointerleave', function () {
        this.style.transform = '';
      });
    }
  }

  function setupScrollUI(progress, topBtn) {
    var lastY = win.scrollY || 0;
    var nav = doc.querySelector('nav, .top');

    function update() {
      var y = win.scrollY || doc.documentElement.scrollTop || 0;
      var h = doc.documentElement.scrollHeight - win.innerHeight;
      var p = h > 0 ? (y / h) * 100 : 0;
      progress.style.width = p.toFixed(2) + '%';
      topBtn.classList.toggle('show', y > 320);

      if (nav && win.innerWidth > 900) {
        if (y > lastY + 8 && y > 120) {
          nav.style.transform = 'translateY(-100%)';
          nav.style.transition = 'transform 0.35s ease';
        } else if (y < lastY - 8) {
          nav.style.transform = 'translateY(0)';
          nav.style.transition = 'transform 0.35s ease';
        }
      }

      lastY = y;
    }

    win.addEventListener('scroll', update, { passive: true });
    update();
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = doc.querySelector('script[data-twlx="' + src + '"]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(); }, { once: true });
        existing.addEventListener('error', function () { reject(new Error('load failed')); }, { once: true });
        if (existing.dataset.loaded === '1') resolve();
        return;
      }

      var s = doc.createElement('script');
      s.src = src;
      s.async = true;
      s.defer = true;
      s.dataset.twlx = src;
      s.onload = function () {
        s.dataset.loaded = '1';
        resolve();
      };
      s.onerror = function () {
        reject(new Error('load failed: ' + src));
      };
      doc.head.appendChild(s);
    });
  }

  function initLenis() {
    if (prefersReducedMotion) return Promise.resolve(false);

    return loadScript('https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/bundled/lenis.min.js')
      .then(function () {
        if (!win.Lenis) return false;
        state.lenis = new win.Lenis({
          lerp: 0.09,
          duration: 1.12,
          smoothWheel: true,
          smoothTouch: false,
          wheelMultiplier: 0.9,
          touchMultiplier: 1.6
        });

        function raf(time) {
          if (state.lenis) state.lenis.raf(time);
          win.requestAnimationFrame(raf);
        }

        win.requestAnimationFrame(raf);
        return true;
      })
      .catch(function () { return false; });
  }

  function initGSAP() {
    if (prefersReducedMotion) return Promise.resolve(false);

    return Promise.all([
      loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js'),
      loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js')
    ])
      .then(function () {
        if (!win.gsap || !win.ScrollTrigger) return false;
        win.gsap.registerPlugin(win.ScrollTrigger);
        state.gsap = win.gsap;
        state.scrollTrigger = win.ScrollTrigger;
        return true;
      })
      .catch(function () { return false; });
  }

  function animateWithGSAP() {
    if (!state.gsap || !state.scrollTrigger) return;
    var gsap = state.gsap;
    var ScrollTrigger = state.scrollTrigger;

    var heroTitle = doc.querySelector('.hero-title, .page-title, h1');
    if (heroTitle && !heroTitle.dataset.twlxSplit) {
      var text = heroTitle.textContent || '';
      var words = text.trim().split(/\s+/);
      if (words.length > 2 && words.length < 22) {
        heroTitle.dataset.twlxSplit = '1';
        heroTitle.textContent = '';
        for (var i = 0; i < words.length; i += 1) {
          var span = el('span');
          span.textContent = words[i] + (i === words.length - 1 ? '' : ' ');
          span.style.display = 'inline-block';
          span.style.opacity = '0';
          span.style.transform = 'translateY(22px)';
          heroTitle.appendChild(span);
        }
        gsap.to(heroTitle.children, {
          y: 0,
          opacity: 1,
          duration: 0.74,
          ease: 'power3.out',
          stagger: 0.045,
          delay: 0.04
        });
      }
    }

    var reveal = doc.querySelectorAll('.twlx-reveal');
    for (var j = 0; j < reveal.length; j += 1) {
      var node = reveal[j];
      gsap.fromTo(node,
        { y: 32, opacity: 0, scale: 0.985 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: node,
            start: 'top 88%',
            once: true
          }
        }
      );
    }

    var heroVisual = doc.querySelector('.hero-visual, .moto-wrap, .brand-canvas');
    if (heroVisual) {
      gsap.to(heroVisual, {
        yPercent: -4,
        rotate: 0.4,
        ease: 'none',
        scrollTrigger: {
          trigger: heroVisual,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    var orbs = doc.querySelectorAll('.hero-orb, .brand-glow-1, .brand-glow-2');
    for (var k = 0; k < orbs.length; k += 1) {
      gsap.to(orbs[k], {
        x: (k % 2 ? 20 : -20),
        y: (k % 2 ? -18 : 18),
        duration: 4.6 + (k * 0.4),
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
    }

    ScrollTrigger.refresh();
  }

  function decorateParallaxByMouse() {
    if (IS_TOUCH || prefersReducedMotion) return;
    var targets = doc.querySelectorAll('.hero-orb, .brand-glow-1, .brand-glow-2, .twlx-grad');
    if (!targets.length) return;

    var raf = 0;
    function move() {
      raf = 0;
      var nx = (state.pointer.x / Math.max(win.innerWidth, 1)) - 0.5;
      var ny = (state.pointer.y / Math.max(win.innerHeight, 1)) - 0.5;
      for (var i = 0; i < targets.length; i += 1) {
        var mult = 8 + i * 2;
        targets[i].style.transform = 'translate3d(' + (nx * mult).toFixed(2) + 'px,' + (ny * mult).toFixed(2) + 'px,0)';
      }
    }

    win.addEventListener('pointermove', function (evt) {
      state.pointer.x = evt.clientX;
      state.pointer.y = evt.clientY;
      if (!raf) raf = win.requestAnimationFrame(move);
    }, { passive: true });
  }

  function setActiveNavByPath() {
    var path = getCurrentPath();
    var links = doc.querySelectorAll('.nav-links a, .nav a, .mob-menu a');
    for (var i = 0; i < links.length; i += 1) {
      var href = links[i].getAttribute('href') || '';
      if (!href || href.charAt(0) === '#') continue;
      if (href.split('?')[0] === path) {
        links[i].classList.add('active');
      }
    }
  }

  function boostInputUX() {
    var fields = doc.querySelectorAll('input, textarea, select');
    for (var i = 0; i < fields.length; i += 1) {
      fields[i].addEventListener('focus', function () {
        this.style.boxShadow = '0 0 0 3px rgba(255, 154, 94, 0.2), 0 0 0 1px rgba(255, 221, 181, 0.52) inset';
      });
      fields[i].addEventListener('blur', function () {
        this.style.boxShadow = '';
      });
    }
  }

  function prepareLinkData() {
    var merged = DEFAULT_LINKS.concat(gatherAnchors());
    state.links = dedupeLinks(merged);
  }

  function init() {
    createLayers();
    prepareLinkData();
    injectExperienceBlocks();
    setActiveNavByPath();

    var progress = createProgressBar();
    var topBtn = createTopButton();
    var cursor = createCursor();

    markRevealTargets();
    attachRevealObserver();
    setupScrollUI(progress, topBtn);

    var deck = createCommandDeck();
    createMobileDock(deck);

    setupMagneticButtons();
    setupCardTilt();
    decorateParallaxByMouse();
    boostInputUX();

    showToast('Luxury mode active · press /', 1700);

    Promise.all([initLenis(), initGSAP()]).then(function (res) {
      var lenisReady = !!res[0];
      var gsapReady = !!res[1];
      if (gsapReady) {
        animateWithGSAP();
      }
      if (lenisReady || gsapReady) {
        var parts = [];
        if (lenisReady) parts.push('smooth scroll');
        if (gsapReady) parts.push('pro animations');
        showToast(parts.join(' + ') + ' enabled', 1400);
      }
    });

    if (cursor) {
      win.addEventListener('blur', function () {
        cursor.classList.remove('active');
      });
    }
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
