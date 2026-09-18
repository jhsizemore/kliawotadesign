/* Odyssey v3.16: mobile navigation only. Card/art storage and rendering stay owned by Studio. */
(function (root) {
  'use strict';
  const VERSION = '3.16';
  function neighbour(numbers, current, direction) {
    if (!numbers.length) return null;
    const i = numbers.indexOf(current);
    if (i < 0) return direction > 0 ? numbers[0] : numbers[numbers.length - 1];
    return numbers[i + direction] ?? null;
  }
  function orderedRows(rows, order) {
    return [...rows].sort((a, b) => order === 'name'
      ? a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }) || a.number - b.number
      : a.number - b.number);
  }
  function install() {
    if (document.getElementById('odysseyMobileNav') || typeof CARDS === 'undefined' || typeof root.selectCard !== 'function') return;
    const $ = id => document.getElementById(id);
    const browser = document.querySelector('.browser'), list = $('cardList'), search = $('search');
    const inspector = $('inspector'), stage = document.querySelector('.stage'), topbar = document.querySelector('.topbar');
    if (!browser || !list || !search || !inspector || !stage || !topbar || typeof HTMLDialogElement === 'undefined') return;
    const mq = root.matchMedia('(max-width: 760px)');
    const originalHome = document.createComment('Odyssey desktop browser');
    browser.before(originalHome);
    const filterIds = ['filterColor', 'filterLayout', 'filterArt', 'filterState', 'filterReview'];
    const filterLabels = ['Filter by frame colour', 'Filter by card layout', 'Filter by artwork state', 'Filter by card state', 'Filter by review state'];
    filterIds.forEach((id, i) => $(id)?.setAttribute('aria-label', filterLabels[i]));
    search.type = 'search'; search.setAttribute('aria-label', 'Search cards, rules, mechanics and story');
    search.setAttribute('enterkeyhint', 'search');
    const dialog = document.createElement('dialog');
    dialog.id = 'odysseyCardBrowser'; dialog.className = 'odyssey-card-browser';
    dialog.setAttribute('aria-labelledby', 'odysseyBrowserTitle');
    dialog.innerHTML = '<div class="odyssey-browser-head"><div><h2 id="odysseyBrowserTitle">Cards</h2><small>Odyssey · v3.16</small></div><button type="button" class="btn secondary" id="odysseyBrowserClose" autofocus>Done</button></div>';
    document.body.appendChild(dialog);
    const nav = document.createElement('nav');
    nav.id = 'odysseyMobileNav'; nav.className = 'odyssey-mobile-nav'; nav.setAttribute('aria-label', 'Card navigation');
    nav.innerHTML = '<button type="button" id="odysseyPrev" aria-label="Previous card in this list">←<small>Prev</small></button><button type="button" id="odysseyBrowse" aria-haspopup="dialog" aria-controls="odysseyCardBrowser" aria-expanded="false"><strong>Browse cards</strong><small id="odysseyPosition" role="status" aria-live="polite"></small></button><button type="button" id="odysseyNext" aria-label="Next card in this list">→<small>Next</small></button><button type="button" id="odysseyEdit" aria-controls="inspector" aria-expanded="false">✎<small>Edit</small></button>';
    document.body.appendChild(nav);
    const tools = browser.querySelector('.browser-tools');
    const details = document.createElement('details'); details.className = 'odyssey-mobile-filters';
    details.innerHTML = '<summary id="odysseyFilterSummary">Filters</summary>';
    const moved = [];
    const bar = document.createElement('div'); bar.className = 'odyssey-browser-controls';
    bar.innerHTML = '<label class="odyssey-sort">Sort<select id="odysseyCardSort"><option value="number">Card number</option><option value="name">Name A–Z</option></select></label><button type="button" class="btn secondary" id="odysseyFindCurrent">Current card</button><button type="button" class="btn secondary" id="odysseyClearFilters">Clear</button><form id="odysseyJumpForm"><label for="odysseyJump">Card #</label><input id="odysseyJump" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="001" autocomplete="off"><button class="btn secondary" type="submit">Go</button></form>';
    const message = document.createElement('div'); message.id = 'odysseyBrowserMessage'; message.className = 'odyssey-browser-message'; message.setAttribute('role', 'status');
    const empty = document.createElement('div'); empty.className = 'odyssey-browser-empty'; empty.hidden = true;
    empty.textContent = 'No matching cards. Change your search or tap Clear to show the set again.';
    dialog.appendChild(empty);
    let mobile = false, sort = 'number', lastScroll = 0, lastBrowserCard = null, firstOpen = true, scheduled = false;
    let originalBrand = '', copyHome = null;
    const selectedNumber = () => typeof selected !== 'undefined' ? Number(selected) : Number(list.querySelector('.active')?.dataset.n);
    const rows = () => [...list.querySelectorAll('.card-row[data-n]')];
    const numbers = () => rows().map(row => Number(row.dataset.n));
    function queueSync() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; sync(); });
    }
    const observer = new MutationObserver(queueSync);
    function observeList() { observer.observe(list, { childList: true }); }
    function sync() {
      if (!mobile) return;
      const before = rows();
      const ordered = orderedRows(before.map(node => ({ node, number: Number(node.dataset.n), name: node.querySelector('.row-name')?.textContent || '' })), sort);
      if (ordered.some((row, i) => row.node !== before[i])) {
        observer.disconnect(); list.replaceChildren(...ordered.map(row => row.node)); observeList();
      }
      rows().forEach(row => {
        row.setAttribute('role', 'button'); row.tabIndex = 0;
        row.setAttribute('aria-label', 'Card ' + row.dataset.n + ': ' + (row.querySelector('.row-name')?.textContent || ''));
        if (Number(row.dataset.n) === selectedNumber()) row.setAttribute('aria-current', 'true');
        else row.removeAttribute('aria-current');
      });
      const ns = numbers(), current = selectedNumber(), index = ns.indexOf(current);
      $('odysseyPosition').textContent = ns.length ? (index < 0 ? 'Outside filter · ' + ns.length + ' cards' : (index + 1) + ' / ' + ns.length) : 'No matches';
      $('odysseyPrev').disabled = neighbour(ns, current, -1) === null;
      $('odysseyNext').disabled = neighbour(ns, current, 1) === null;
      $('odysseyClearFilters').disabled = !search.value && !filterIds.some(id => $(id)?.value) && !(typeof workflowPrefs !== 'undefined' && workflowPrefs.browserQueue);
      const active = filterIds.filter(id => $(id)?.value).length + (typeof workflowPrefs !== 'undefined' && workflowPrefs.browserQueue ? 1 : 0);
      $('odysseyFilterSummary').textContent = active ? 'Filters · ' + active + ' active' : 'Filters';
      empty.hidden = ns.length > 0;
      if (dialog.open && !ns.length) message.textContent = '';
      $('odysseyEdit').setAttribute('aria-expanded', String(inspector.classList.contains('open')));
      $('odysseyEdit').querySelector('small').textContent = inspector.classList.contains('open') ? 'Close' : 'Edit';
    }
    function findCurrent() {
      const row = rows().find(item => Number(item.dataset.n) === selectedNumber());
      if (!row) { message.textContent = 'The current card is outside these filters. Tap Clear to show all cards.'; return; }
      const rect = row.getBoundingClientRect(), viewport = list.getBoundingClientRect();
      list.scrollTop += rect.top - viewport.top - (list.clientHeight - rect.height) / 2;
      lastScroll = list.scrollTop; message.textContent = '';
    }
    function closeBrowser(showPreview = false) {
      if (!dialog.open) return;
      lastScroll = list.scrollTop; lastBrowserCard = selectedNumber();
      dialog.close(); document.body.classList.remove('odyssey-browser-open');
      $('odysseyBrowse').setAttribute('aria-expanded', 'false');
      if (showPreview) { inspector.classList.remove('open'); stage.scrollTop = 0; root.scrollTo({ top: 0, behavior: 'instant' }); }
      sync();
    }
    function openBrowser() {
      if (!mobile || dialog.open) return;
      sync(); message.textContent = '';
      dialog.showModal(); document.body.classList.add('odyssey-browser-open');
      $('odysseyBrowse').setAttribute('aria-expanded', 'true');
      // Focus Done rather than search: opening the browser must not summon the phone keyboard.
      $('odysseyBrowserClose').focus({ preventScroll: true });
      if (firstOpen || lastBrowserCard !== selectedNumber()) findCurrent(); else list.scrollTop = lastScroll;
      firstOpen = false;
    }
    function clearFilters() {
      search.value = ''; filterIds.forEach(id => { if ($(id)) $(id).value = ''; });
      if (typeof root.setBrowserQueueMode === 'function') root.setBrowserQueueMode(false); else root.renderList();
      lastScroll = 0; list.scrollTop = 0; message.textContent = ''; sync();
    }
    function navigate(direction) {
      // Blurring commits any focused editor field before Studio renders the next card.
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      sync(); const n = neighbour(numbers(), selectedNumber(), direction);
      if (n === null) return;
      const editorScroll = inspector.scrollTop;
      root.selectCard(n); sync();
      requestAnimationFrame(() => { if (inspector.classList.contains('open')) inspector.scrollTop = editorScroll; });
    }
    function resize() {
      if (!mobile) return;
      document.documentElement.style.setProperty('--odyssey-card-scale', String(Math.min(1, Math.max(.1, (document.documentElement.clientWidth - 24) / 378))));
      document.documentElement.style.setProperty('--odyssey-mobile-top', topbar.getBoundingClientRect().height + 'px');
      // visualViewport keeps the browser's scrolling list above the on-screen keyboard.
      const viewport = root.visualViewport;
      dialog.style.setProperty('--odyssey-picker-height', (viewport ? viewport.height : root.innerHeight) + 'px');
      dialog.style.setProperty('--odyssey-picker-top', (viewport ? viewport.offsetTop : 0) + 'px');
    }
    function applyBreakpoint() {
      if (mobile === mq.matches) return;
      mobile = mq.matches;
      document.body.classList.toggle('odyssey-mobile', mobile);
      if (mobile) {
        dialog.insertBefore(browser, empty);
        [browser.querySelector('.filters'), tools.querySelector('.buttons')].filter(Boolean).forEach(node => {
          const placeholder = document.createComment('desktop filter position'); node.before(placeholder); moved.push({ node, placeholder }); details.appendChild(node);
        });
        search.after(details); details.after(bar); tools.appendChild(message);
        originalBrand = topbar.querySelector('.brand')?.textContent || '';
        if (topbar.querySelector('.brand')) topbar.querySelector('.brand').textContent = 'Odyssey';
        const copy = $('copyOriginalArt'), artPane = $('pane-art');
        if (copy && artPane) { copyHome = document.createComment('desktop art-transfer button'); copy.before(copyHome); artPane.prepend(copy); }
        resize(); sync();
      } else {
        closeBrowser(); originalHome.after(browser);
        moved.splice(0).forEach(({ node, placeholder }) => { placeholder.replaceWith(node); });
        details.remove(); bar.remove(); message.remove();
        if (copyHome && $('copyOriginalArt')) { copyHome.replaceWith($('copyOriginalArt')); copyHome = null; }
        if (topbar.querySelector('.brand')) topbar.querySelector('.brand').textContent = originalBrand;
        root.renderList();
      }
    }
    $('odysseyBrowse').onclick = openBrowser; $('odysseyBrowserClose').onclick = () => closeBrowser();
    $('odysseyPrev').onclick = () => navigate(-1); $('odysseyNext').onclick = () => navigate(1);
    $('odysseyEdit').onclick = () => { inspector.classList.toggle('open'); sync(); };
    // Controls in bar are detached until the first mobile breakpoint.
    bar.querySelector('#odysseyFindCurrent').onclick = findCurrent;
    bar.querySelector('#odysseyClearFilters').onclick = clearFilters;
    bar.querySelector('#odysseyCardSort').onchange = e => { sort = e.target.value; lastScroll = 0; sync(); list.scrollTop = 0; };
    bar.querySelector('#odysseyJumpForm').onsubmit = e => {
      e.preventDefault(); const raw = $('odysseyJump').value.trim(), n = Number(raw);
      if (!/^\d+$/.test(raw) || !CARDS.some(card => Number(card.number) === n)) { message.textContent = 'Enter a card number that exists in this set.'; return; }
      document.activeElement?.blur(); clearFilters(); root.selectCard(n); sync(); $('odysseyJump').value = ''; closeBrowser(true);
    };
    dialog.addEventListener('cancel', e => { e.preventDefault(); closeBrowser(); });
    dialog.addEventListener('close', () => { document.body.classList.remove('odyssey-browser-open'); $('odysseyBrowse').setAttribute('aria-expanded', 'false'); });
    dialog.addEventListener('keydown', e => { e.stopPropagation(); }); // Do not run Studio's approve/edit shortcuts while browsing.
    list.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card-row')) { e.preventDefault(); e.target.click(); } });
    list.addEventListener('click', e => { if (mobile && e.target.closest('.card-row')) closeBrowser(true); });
    list.addEventListener('scroll', () => { if (dialog.open) lastScroll = list.scrollTop; }, { passive: true });
    tools.addEventListener('click', e => { if (mobile && e.target.closest('#browserNewArt')) closeBrowser(); }, true);
    ['input', 'change'].forEach(type => tools.addEventListener(type, e => {
      if (e.target === search || filterIds.includes(e.target.id)) { lastScroll = 0; list.scrollTop = 0; message.textContent = ''; queueSync(); }
    }));
    observeList();
    new MutationObserver(queueSync).observe(inspector, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(queueSync).observe($('selectedTitle'), { childList: true, subtree: true });
    mq.addEventListener('change', applyBreakpoint); root.addEventListener('resize', resize);
    root.visualViewport?.addEventListener('resize', resize); root.visualViewport?.addEventListener('scroll', resize);
    new ResizeObserver(resize).observe(topbar);
    root.addEventListener('beforeprint', () => closeBrowser());
    const label = document.querySelector('.topbar .version');
    if (label) label.textContent = 'v' + VERSION + ' · mobile card browser';
    applyBreakpoint();
  }
  const api = { VERSION, neighbour, orderedRows, install };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OdysseyMobileNav = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
    else install();
  }
})(typeof window !== 'undefined' ? window : globalThis);
