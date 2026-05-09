(function () {
  if (window.__twLuxuryLoaded || window.__twLuxuryV2Loaded) return;
  window.__twLuxuryLoaded = true;
  window.__twLuxuryV2Loaded = true;

  var doc = document;
  var win = window;
  var body = doc.body;
  if (!body) return;

  var prefersReducedMotion = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IS_TOUCH = ('ontouchstart' in win) || (navigator.maxTouchPoints > 0);
  var MAX_DISCOVERED_LINKS = 70;
  var MAX_DISCOVERED_LINK_TITLE_LENGTH = 64;
  var MAX_LINK_TITLE_LENGTH = 70;
  var CART_UPDATE_DELAY_MS = 50;
  var MAGNETIC_STRENGTH = 8;
  var TILT_ANGLE_X = 6;
  var TILT_ANGLE_Y = 8;
  var CARD_HOVER_LIFT_PX = 6;
  var NAV_SCROLL_DELTA = 8;
  var NAV_MIN_HIDE_SCROLL = 120;
  var SPLIT_MIN_WORDS = 2;
  var SPLIT_MAX_WORDS = 22;
  var THEME_STORAGE_KEY = 'twlxThemeMode';
  var DEFAULT_RIDER_RATING = '4.9';
  var CART_STORAGE_KEYS = ['twCart', 'cart', 'twoWheelCart', 'TW_CART'];
  var GSAP_VERSION = '3.12.5';
  var THREE_VERSION = '0.164.1';
  var SPLIT_TYPE_VERSION = '0.3.4';
  var TOP_RATED_THRESHOLD = 4.8;
  var state = {
    lenis: null,
    gsap: null,
    scrollTrigger: null,
    splitTypeReady: false,
    threeReady: false,
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
      if (title.length > MAX_LINK_TITLE_LENGTH) continue;
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
    for (var i = 0; i < all.length && found.length < MAX_DISCOVERED_LINKS; i += 1) {
      var a = all[i];
      var href = isSafeHref(a.getAttribute('href'));
      if (!href) continue;
      if (!isInternalHref(href)) continue;
      var t = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t || t.length > MAX_DISCOVERED_LINK_TITLE_LENGTH) continue;
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
    return [
      { v: '1-click', l: 'Navigation' },
      { v: String(productCount), l: 'Products live' },
      { v: DEFAULT_RIDER_RATING + '/5', l: 'Rider rating' },
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
    var cmdTitle = el('b', null, 'Luxury Access');
    var cmdHint = el('span', 'hint', 'Ctrl/⌘+K');
    cmdBtn.appendChild(cmdTitle);
    cmdBtn.appendChild(cmdHint);

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
      var activeInput = activeTag === 'input' || activeTag === 'textarea' || (doc.activeElement && doc.activeElement.isContentEditable === true);
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
    var keys = CART_STORAGE_KEYS;
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
      var icon = el('span', null, emoji);
      var text = el('small', null, label);
      a.appendChild(icon);
      a.appendChild(text);
      if (current === href.split('?')[0]) a.classList.add('is-active');
      return a;
    }

    var home = makeLink('index.html', 'Home', '🏠');
    var shop = makeLink('shop.html', 'Shop', '🛍️');
    var cart = makeLink('cart.html', 'Cart', '🛒');

    var searchBtn = el('button');
    searchBtn.type = 'button';
    searchBtn.appendChild(el('span', null, '⌕'));
    searchBtn.appendChild(el('small', null, 'Search'));
    searchBtn.addEventListener('click', function () {
      if (commandDeck) commandDeck.open();
    });

    var topBtn = el('button');
    topBtn.type = 'button';
    topBtn.appendChild(el('span', null, '↑'));
    topBtn.appendChild(el('small', null, 'Top'));
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
    var onStorage = function () {
      updateCartLabel();
    };
    var onVisible = function () {
      if (!doc.hidden) updateCartLabel();
    };
    win.addEventListener('storage', onStorage);
    doc.addEventListener('visibilitychange', onVisible);

    var updateTriggers = doc.querySelectorAll('.cart-btn, .product-quick-add, [data-add-to-cart], .qty-plus, .qty-minus, .quantity-btn');
    function onPotentialCartChange() {
      win.setTimeout(updateCartLabel, CART_UPDATE_DELAY_MS);
    }
    for (var t = 0; t < updateTriggers.length; t += 1) {
      updateTriggers[t].addEventListener('click', onPotentialCartChange, { passive: true });
    }

    var observed = doc.querySelectorAll('#cartBadge, #mobCartBadge, .cart-badge, .mob-cart-badge');
    var mo = null;
    if ('MutationObserver' in win && observed.length) {
      mo = new MutationObserver(updateCartLabel);
      for (var o = 0; o < observed.length; o += 1) {
        mo.observe(observed[o], { childList: true, characterData: true, subtree: true });
      }
    }

    win.addEventListener('pagehide', function cleanupDockListeners() {
      win.removeEventListener('storage', onStorage);
      doc.removeEventListener('visibilitychange', onVisible);
      for (var r = 0; r < updateTriggers.length; r += 1) {
        updateTriggers[r].removeEventListener('click', onPotentialCartChange);
      }
      if (mo) mo.disconnect();
    }, { once: true });
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
        this.style.transform = 'translate(' + (dx * MAGNETIC_STRENGTH).toFixed(2) + 'px,' + (dy * MAGNETIC_STRENGTH).toFixed(2) + 'px)';
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
        var rx = (0.5 - py) * TILT_ANGLE_X;
        var ry = (px - 0.5) * TILT_ANGLE_Y;
        this.style.transform = 'translateY(-' + CARD_HOVER_LIFT_PX + 'px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
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
        if (y > lastY + NAV_SCROLL_DELTA && y > NAV_MIN_HIDE_SCROLL) {
          nav.style.transform = 'translateY(-100%)';
          nav.style.transition = 'transform 0.35s ease';
        } else if (y < lastY - NAV_SCROLL_DELTA) {
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
        if (existing.dataset.loaded === '1') {
          resolve();
          return;
        }
        existing.addEventListener('load', function () { resolve(); }, { once: true });
        existing.addEventListener('error', function () { reject(new Error('load failed: ' + src)); }, { once: true });
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
    var gsapBase = 'https://cdn.jsdelivr.net/npm/gsap@' + GSAP_VERSION + '/dist/';

    return Promise.all([
      loadScript(gsapBase + 'gsap.min.js'),
      loadScript(gsapBase + 'ScrollTrigger.min.js')
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
      if (words.length > SPLIT_MIN_WORDS && words.length <= SPLIT_MAX_WORDS) {
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

    var rafId = 0;
    function move() {
      rafId = 0;
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
      if (!rafId) rafId = win.requestAnimationFrame(move);
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
        this.classList.add('twlx-focus-ring');
      });
      fields[i].addEventListener('blur', function () {
        this.classList.remove('twlx-focus-ring');
      });
    }
  }

  function addToCartUniversal(product, qty) {
    var amount = Math.max(1, Number(qty) || 1);
    if (typeof win.quickAdd === 'function') {
      for (var i = 0; i < amount; i += 1) {
        win.quickAdd(product.id, product.name, product.price, product.category);
      }
      return;
    }
    var cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('twCart') || '[]');
      if (!Array.isArray(cart)) cart = [];
    } catch (e) {
      cart = [];
    }
    var row = null;
    for (var j = 0; j < cart.length; j += 1) {
      if (Number(cart[j].id) === Number(product.id) && String(cart[j].name) === String(product.name)) {
        row = cart[j];
        break;
      }
    }
    if (row) {
      row.qty = Math.max(0, Number(row.qty) || 0) + amount;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        cat: product.category,
        qty: amount
      });
    }
    localStorage.setItem('twCart', JSON.stringify(cart));
    showToast(product.name + ' added to cart', 1400);
  }

  function createThemeSwitcher() {
    var wrap = el('div', 'twlx-theme-switcher');
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Theme mode');

    var dark = el('button', 'is-active', 'Obsidian');
    dark.type = 'button';
    var light = el('button', null, 'Porcelain');
    light.type = 'button';
    wrap.appendChild(dark);
    wrap.appendChild(light);
    body.appendChild(wrap);

    function apply(mode) {
      var useLight = mode === 'light';
      body.classList.toggle('twlx-light', useLight);
      dark.classList.toggle('is-active', !useLight);
      light.classList.toggle('is-active', useLight);
      try { localStorage.setItem(THEME_STORAGE_KEY, useLight ? 'light' : 'dark'); } catch (e) {}
    }

    dark.addEventListener('click', function () { apply('dark'); });
    light.addEventListener('click', function () { apply('light'); });

    var saved = '';
    try { saved = localStorage.getItem(THEME_STORAGE_KEY) || ''; } catch (e) { saved = ''; }
    if (saved === 'light') apply('light');
  }

  function mountCampaignRail() {
    var hero = doc.querySelector('.hero, .page-hero, .head');
    if (!hero || doc.querySelector('.twlx-campaign')) return;
    var host = hero.parentNode;
    if (!host) return;

    var campaign = el('section', 'twlx-campaign twlx-reveal');
    var inner = el('div', 'twlx-campaign-inner');
    var left = el('article', 'twlx-campaign-copy');
    left.appendChild(el('span', 'eyebrow', 'Seasonal campaign'));
    left.appendChild(el('h2', null, 'Midnight Asphalt · Precision luxury for the road and beyond.'));
    left.appendChild(el('p', null, 'A complete style drop for riders: fragrances, jackets, and technical basics built as one coherent system.'));
    var ctaRow = el('div', 'cta-row');
    var cta1 = el('a', 'btn-primary', 'Shop the campaign');
    cta1.href = 'shop.html';
    var cta2 = el('a', 'btn-outline', 'Explore collections');
    cta2.href = 'collections.html';
    ctaRow.appendChild(cta1);
    ctaRow.appendChild(cta2);
    left.appendChild(ctaRow);

    var right = el('div', 'twlx-campaign-track');
    var cards = [
      { k: 'Drop', v: 'No. 04' },
      { k: 'Signature scent', v: 'Chrome Dusk' },
      { k: 'Core layer', v: 'Speed Classic' },
      { k: 'Accessories', v: 'Travel-ready edits' }
    ];
    for (var i = 0; i < cards.length; i += 1) {
      var card = el('div', 'twlx-campaign-card');
      card.appendChild(el('small', null, cards[i].k));
      card.appendChild(el('strong', null, cards[i].v));
      right.appendChild(card);
    }

    inner.appendChild(left);
    inner.appendChild(right);
    campaign.appendChild(inner);
    host.insertBefore(campaign, hero);
  }

  function createQuickViewModal() {
    if (!win.TWCatalog || !Array.isArray(win.TWCatalog.products)) return null;
    if (doc.getElementById('twlxQuickView')) return doc.getElementById('twlxQuickView');

    var shell = el('section', 'twlx-qv');
    shell.id = 'twlxQuickView';
    shell.setAttribute('aria-label', 'Quick product view');

    var card = el('div', 'twlx-qv-card');
    var close = el('button', 'twlx-qv-close', '✕');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close quick view');

    var media = el('div', 'twlx-qv-media');
    var mediaEmoji = el('div', 'twlx-qv-emoji', '🧥');
    var badge = el('span', 'twlx-qv-badge', 'Featured');
    media.appendChild(mediaEmoji);
    media.appendChild(badge);

    var content = el('div', 'twlx-qv-content');
    var cat = el('div', 'twlx-qv-cat', 'Category');
    var title = el('h3', null, 'Product name');
    var desc = el('p', 'twlx-qv-desc', '');
    var price = el('div', 'twlx-qv-price', '$0');
    var rating = el('div', 'twlx-qv-rating', '★★★★★');
    var chips = el('div', 'twlx-qv-chips');
    var actions = el('div', 'twlx-qv-actions');
    var add = el('button', 'btn-primary', 'Add to cart');
    add.type = 'button';
    var viewFull = el('a', 'btn-outline', 'Open full page');
    viewFull.href = 'shop.html';
    actions.appendChild(add);
    actions.appendChild(viewFull);

    content.appendChild(cat);
    content.appendChild(title);
    content.appendChild(desc);
    content.appendChild(price);
    content.appendChild(rating);
    content.appendChild(chips);
    content.appendChild(actions);

    card.appendChild(close);
    card.appendChild(media);
    card.appendChild(content);
    shell.appendChild(card);
    body.appendChild(shell);

    var current = null;

    function render(id) {
      var product = win.TWCatalog.getProduct(id);
      current = product;
      media.style.background = product.gradient;
      mediaEmoji.textContent = product.emoji || '✨';
      badge.textContent = product.badgeLabel || product.categoryLabel;
      cat.textContent = product.categoryLabel + ' — ' + product.sub;
      title.textContent = product.name;
      desc.textContent = product.descriptor;
      price.textContent = '$' + Number(product.price).toFixed(0);
      rating.textContent = win.TWCatalog.stars(product.rating) + ' · ' + product.reviews.toLocaleString() + ' reviews';
      chips.textContent = '';
      var tags = product.tags || [];
      for (var i = 0; i < Math.min(tags.length, 3); i += 1) {
        var chip = el('span', 'twlx-chip', tags[i][2]);
        chips.appendChild(chip);
      }
      viewFull.href = 'product.html?id=' + product.id;
    }

    function open(id) {
      render(id);
      shell.classList.add('open');
      body.classList.add('twlx-lock');
    }

    function closeModal() {
      shell.classList.remove('open');
      body.classList.remove('twlx-lock');
    }

    close.addEventListener('click', closeModal);
    shell.addEventListener('click', function (evt) {
      if (evt.target === shell) closeModal();
    });
    doc.addEventListener('keydown', function (evt) {
      if (evt.key === 'Escape') closeModal();
    });
    add.addEventListener('click', function () {
      if (!current) return;
      addToCartUniversal(current, 1);
      closeModal();
    });

    return { open: open, close: closeModal };
  }

  function mountQuickViewButtons(qv) {
    if (!qv || !qv.open) return;
    var cards = doc.querySelectorAll('.product-card[data-id]');
    for (var i = 0; i < cards.length; i += 1) {
      var card = cards[i];
      if (card.querySelector('.twlx-quickview-btn')) continue;
      var id = Number(card.getAttribute('data-id'));
      if (!Number.isFinite(id) || id <= 0) continue;
      var btn = el('button', 'twlx-quickview-btn', 'Quick view');
      btn.type = 'button';
      btn.addEventListener('click', (function (pid) {
        return function (evt) {
          evt.preventDefault();
          evt.stopPropagation();
          qv.open(pid);
        };
      })(id));
      card.appendChild(btn);
    }
  }

  function mountShopControlRail(qv) {
    var grid = doc.getElementById('productsGrid');
    if (!grid || doc.querySelector('.twlx-shop-rail')) return;
    var anchor = doc.querySelector('.filter-bar, .filters, .arrivals-tabs');
    if (!anchor || !anchor.parentNode) return;

    var rail = el('section', 'twlx-shop-rail twlx-reveal');
    var top = el('div', 'top-row');
    top.appendChild(el('strong', null, 'Luxury control rail'));
    top.appendChild(el('span', null, 'Search and refine instantly'));

    var search = el('input');
    search.type = 'search';
    search.placeholder = 'Search products, tags, categories...';
    search.setAttribute('aria-label', 'Search products');

    var ranges = el('div', 'twlx-range');
    var minInput = el('input');
    minInput.type = 'range';
    minInput.min = '10';
    minInput.max = '400';
    minInput.step = '1';
    minInput.value = '10';
    var maxInput = el('input');
    maxInput.type = 'range';
    maxInput.min = '10';
    maxInput.max = '400';
    maxInput.step = '1';
    maxInput.value = '400';
    var label = el('div', 'price-label', '$10 - $400');
    ranges.appendChild(label);
    ranges.appendChild(minInput);
    ranges.appendChild(maxInput);

    var chips = el('div', 'chip-row');
    var chipData = [
      { key: 'top-rated', text: 'Top rated 4.8+' },
      { key: 'deals', text: 'Deals only' },
      { key: 'new', text: 'New arrivals' }
    ];
    for (var i = 0; i < chipData.length; i += 1) {
      var c = el('button', 'twlx-chip-btn', chipData[i].text);
      c.type = 'button';
      c.dataset.key = chipData[i].key;
      chips.appendChild(c);
    }

    rail.appendChild(top);
    rail.appendChild(search);
    rail.appendChild(ranges);
    rail.appendChild(chips);
    anchor.parentNode.insertBefore(rail, anchor.nextSibling);

    var flags = { 'top-rated': false, deals: false, 'new': false };

    function applyRailFilter() {
      var term = String(search.value || '').toLowerCase().trim();
      var minV = Number(minInput.value) || 10;
      var maxV = Number(maxInput.value) || 400;
      if (minV > maxV) {
        var tmp = minV;
        minV = maxV;
        maxV = tmp;
      }
      label.textContent = '$' + minV + ' - $' + maxV;

      var cards = grid.querySelectorAll('.product-card');
      for (var k = 0; k < cards.length; k += 1) {
        var card = cards[k];
        var text = (card.textContent || '').toLowerCase();
        var price = Number(card.getAttribute('data-price') || 0);
        var rating = Number(card.getAttribute('data-rating') || 0);
        var isNew = Number(card.getAttribute('data-new') || 0) === 1;
        var hasDeal = !!card.querySelector('.price-original,.badge-sale');
        var match = true;
        if (term && text.indexOf(term) === -1) match = false;
        if (price < minV || price > maxV) match = false;
        if (flags['top-rated'] && rating < TOP_RATED_THRESHOLD) match = false;
        if (flags.deals && !hasDeal) match = false;
        if (flags['new'] && !isNew) match = false;
        card.classList.toggle('twlx-filter-hidden', !match);
      }
      mountQuickViewButtons(qv);
    }

    search.addEventListener('input', applyRailFilter);
    minInput.addEventListener('input', applyRailFilter);
    maxInput.addEventListener('input', applyRailFilter);
    var chipButtons = chips.querySelectorAll('.twlx-chip-btn');
    for (var n = 0; n < chipButtons.length; n += 1) {
      chipButtons[n].addEventListener('click', function () {
        var key = this.dataset.key;
        flags[key] = !flags[key];
        this.classList.toggle('active', flags[key]);
        applyRailFilter();
      });
    }

    applyRailFilter();

    var observer = new MutationObserver(function () {
      mountQuickViewButtons(qv);
      applyRailFilter();
    });
    observer.observe(grid, { childList: true, subtree: true });
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
    createThemeSwitcher();
    mountCampaignRail();
    var qv = createQuickViewModal();
    mountQuickViewButtons(qv);
    mountShopControlRail(qv);

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
