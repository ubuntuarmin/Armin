(function(){
  if (window.__twLuxuryLoaded) return;
  window.__twLuxuryLoaded = true;
  var DEFAULT_PRODUCT_COUNT = 36;
  var MAX_AUTO_DISCOVERED_LINKS = 48;

  var body = document.body;
  if (!body) return;

  var progress = document.createElement('div');
  progress.className = 'twlux-progress';
  body.appendChild(progress);

  var glowA = document.createElement('div');
  glowA.className = 'twlux-glow-blob';
  body.appendChild(glowA);
  var glowB = document.createElement('div');
  glowB.className = 'twlux-glow-blob b';
  body.appendChild(glowB);

  var toTop = document.createElement('button');
  toTop.className = 'twlux-top';
  toTop.type = 'button';
  toTop.setAttribute('aria-label', 'Back to top');
  toTop.textContent = '↑';
  toTop.addEventListener('click', function(){ window.scrollTo({ top:0, behavior:'smooth' }); });
  body.appendChild(toTop);

  var toast = document.createElement('div');
  toast.className = 'twlux-toast';
  toast.textContent = 'Press / to open luxury access';
  body.appendChild(toast);

  var quickLinks = [
    { icon:'🏠', title:'Home', note:'Start page', href:'index.html' },
    { icon:'🛍️', title:'Shop All', note:'Full catalog', href:'shop.html' },
    { icon:'🧥', title:'Jackets', note:'Premium outerwear', href:'shop.html?cat=jackets' },
    { icon:'🧴', title:'Cologne', note:'Signature scents', href:'shop.html?cat=cologne' },
    { icon:'🎽', title:'Clothing', note:'Core apparel', href:'shop.html?cat=clothing' },
    { icon:'🎒', title:'Accessories', note:'Final details', href:'shop.html?cat=accessories' },
    { icon:'✨', title:'Collections', note:'Curated looks', href:'collections.html' },
    { icon:'💖', title:'Wishlist', note:'Saved items', href:'wishlist.html' },
    { icon:'🛒', title:'Cart', note:'Checkout fast', href:'cart.html' },
    { icon:'📦', title:'Track Order', note:'Delivery updates', href:'order-tracking.html' },
    { icon:'📏', title:'Size Guide', note:'Find your fit', href:'size-guide.html' },
    { icon:'❓', title:'FAQ', note:'Quick answers', href:'faq.html' },
    { icon:'🚚', title:'Shipping', note:'Delivery policy', href:'shipping.html' },
    { icon:'↩️', title:'Returns', note:'Easy exchanges', href:'returns.html' },
    { icon:'🧼', title:'Care Guide', note:'Keep pieces fresh', href:'care-guide.html' },
    { icon:'📞', title:'Contact', note:'Talk to support', href:'contact.html' },
    { icon:'🏁', title:'About Brand', note:'Two Wheel story', href:'about.html' }
  ];

  function sanitizeHref(href){
    var value = String(href || '').trim();
    if (!value) return null;
    if (value.indexOf('#') === 0) return value;
    var lower = value.toLowerCase();
    if (lower.indexOf('javascript:') === 0 || lower.indexOf('data:') === 0 || lower.indexOf('vbscript:') === 0 || lower.indexOf('file:') === 0) return null;
    try {
      var parsed = new URL(value, window.location.href);
      var protocol = (parsed.protocol || '').toLowerCase();
      if (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:' || protocol === 'tel:') return value;
      return null;
    } catch (e) {
      return null;
    }
  }

  quickLinks = quickLinks.filter(function(item){
    item.href = sanitizeHref(item.href);
    return !!item.href;
  });

  var seen = Object.create(null);
  var discoveredCount = 0;
  Array.prototype.slice.call(document.querySelectorAll('a[href]')).forEach(function(a){
    if (discoveredCount >= MAX_AUTO_DISCOVERED_LINKS) return;
    var href = sanitizeHref(a.getAttribute('href') || '');
    if (!href) return;
    var title = (a.textContent || '').trim();
    if (!title || title.length > 60) return;
    var key = title + '|' + href;
    if (seen[key]) return;
    seen[key] = true;
    discoveredCount += 1;
    quickLinks.push({ icon:'🔗', title:title, note:'Page link', href:href });
  });

  var hubBtn = document.createElement('button');
  hubBtn.className = 'twlux-hub-btn';
  hubBtn.type = 'button';
  hubBtn.textContent = 'Luxury Access';
  hubBtn.setAttribute('aria-label', 'Open luxury access');
  body.appendChild(hubBtn);

  var hub = document.createElement('aside');
  hub.className = 'twlux-hub';
  hub.setAttribute('aria-label', 'Luxury quick access panel');

  var head = document.createElement('div');
  head.className = 'twlux-hub-head';
  var hdStrong = document.createElement('strong');
  hdStrong.textContent = 'Luxury Command Deck';
  var hdText = document.createElement('p');
  hdText.textContent = 'Search every destination, jump in one click, and move through all content instantly.';
  var searchWrap = document.createElement('div');
  searchWrap.className = 'twlux-search';
  var input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Search: jackets, returns, contact, cart…';
  var clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.textContent = 'Clear';
  clearBtn.setAttribute('aria-label', 'Clear search');
  searchWrap.appendChild(input);
  searchWrap.appendChild(clearBtn);
  head.appendChild(hdStrong);
  head.appendChild(hdText);
  head.appendChild(searchWrap);

  var list = document.createElement('div');
  list.className = 'twlux-hub-list';

  hub.appendChild(head);
  hub.appendChild(list);
  body.appendChild(hub);

  function renderList(filterText){
    list.textContent = '';
    var q = (filterText || '').toLowerCase().trim();
    var shown = 0;
    quickLinks.forEach(function(item){
      var hay = (item.title + ' ' + item.note + ' ' + item.href).toLowerCase();
      if (q && hay.indexOf(q) === -1) return;
      shown += 1;

      var a = document.createElement('a');
      a.className = 'twlux-link';
      a.href = item.href;

      var icon = document.createElement('span');
      icon.textContent = item.icon;

      var mid = document.createElement('span');
      var t = document.createElement('strong');
      t.textContent = item.title;
      var n = document.createElement('small');
      n.textContent = item.note;
      mid.appendChild(t);
      mid.appendChild(document.createElement('br'));
      mid.appendChild(n);

      var go = document.createElement('span');
      go.className = 'go';
      go.textContent = '›';

      a.appendChild(icon);
      a.appendChild(mid);
      a.appendChild(go);
      list.appendChild(a);
    });
    if (!shown){
      var empty = document.createElement('div');
      empty.className = 'twlux-empty';
      empty.textContent = 'No results. Try another term.';
      list.appendChild(empty);
    }
  }

  function toggleHub(force){
    var open = typeof force === 'boolean' ? force : !hub.classList.contains('open');
    hub.classList.toggle('open', open);
    if (open) {
      input.focus();
      if (!input.value){
        toast.textContent = 'Everything is one click away now';
        toast.classList.add('show');
        setTimeout(function(){ toast.classList.remove('show'); }, 1300);
      }
    }
  }

  hubBtn.addEventListener('click', function(){ toggleHub(); });
  clearBtn.addEventListener('click', function(){ input.value=''; renderList(''); input.focus(); });
  input.addEventListener('input', function(){ renderList(input.value); });
  document.addEventListener('keydown', function(e){
    if (e.key === '/' && !/input|textarea/i.test((document.activeElement && document.activeElement.tagName) || '')) {
      e.preventDefault();
      toggleHub(true);
    }
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      toggleHub(true);
    }
    if (e.key === 'Escape') toggleHub(false);
  });

  var firstSection = document.querySelector('.hero, .page-hero, main section, .wrap section') || document.querySelector('main') || body.firstElementChild;
  if (firstSection && firstSection.parentNode){
    var spotlight = document.createElement('section');
    spotlight.className = 'twlux-spotlight twlux-reveal';

    var left = document.createElement('div');
    var t1 = document.createElement('div');
    t1.className = 'twlux-spotlight-title';
    t1.textContent = 'Concierge Highlights';
    var main = document.createElement('div');
    main.className = 'twlux-spotlight-main';
    main.textContent = 'Navigate the entire Two Wheel universe instantly with smart shortcuts, featured drops, and support links in one place.';
    var sub = document.createElement('div');
    sub.className = 'twlux-spotlight-sub';
    sub.textContent = 'No more deep clicking. Jump from products to policy pages, browse categories, and find your next pickup in seconds.';
    var chips = document.createElement('div');
    chips.className = 'twlux-chip-row';
    ['Express Access','Premium Curation','Always-on Support','Fast Discovery'].forEach(function(c){
      var chip = document.createElement('span');
      chip.className = 'twlux-chip';
      chip.textContent = c;
      chips.appendChild(chip);
    });
    left.appendChild(t1); left.appendChild(main); left.appendChild(sub); left.appendChild(chips);

    var right = document.createElement('div');
    right.className = 'twlux-kpis';
    var productCount = (window.TWCatalog && Array.isArray(window.TWCatalog.products)) ? window.TWCatalog.products.length : DEFAULT_PRODUCT_COUNT;
    [
      ['1-Click', 'Page Jumps'],
      [String(productCount), 'Products Live'],
      ['24/7', 'Self-Service Help']
    ].forEach(function(k){
      var box = document.createElement('article');
      box.className = 'twlux-kpi';
      var strong = document.createElement('strong');
      strong.textContent = k[0];
      var span = document.createElement('span');
      span.textContent = k[1];
      box.appendChild(strong); box.appendChild(span);
      right.appendChild(box);
    });

    spotlight.appendChild(left);
    spotlight.appendChild(right);
    firstSection.parentNode.insertBefore(spotlight, firstSection.nextSibling);
  }

  renderList('');

  var revealTargets = Array.prototype.slice.call(document.querySelectorAll('.card, .product-card, .hero, .story, section, .faq-item, .collection-card'));
  revealTargets.forEach(function(el){ if (!el.classList.contains('twlux-reveal')) el.classList.add('twlux-reveal'); });

  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold:.12 });
    revealTargets.forEach(function(el){ io.observe(el); });
    var s = document.querySelector('.twlux-spotlight');
    if (s) io.observe(s);
  } else {
    revealTargets.forEach(function(el){ el.classList.add('in'); });
  }

  function onScroll(){
    var top = window.pageYOffset || document.documentElement.scrollTop || 0;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? (top / h) * 100 : 0;
    progress.style.width = p.toFixed(2) + '%';
    toTop.classList.toggle('show', top > 380);
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  setTimeout(function(){ toast.classList.add('show'); }, 700);
  setTimeout(function(){ toast.classList.remove('show'); }, 2200);
})();
