/* Odyssey Studio: fixed playtest decks, captured through the current native renderer.
 * Read-only feature. It never changes card models, crop profiles, sheet queues or storage.
 * The deck selection is dated 14 October 2026; card text and artwork are captured live.
 */
(function (root) {
  'use strict';
  if (root.OdysseyDraftDecks) return;
  const DECKS = [
    { code: 'WU', name: 'A Stranger Comes Home', tagline: 'Shelter the castaway, reveal the familiar face, and unweave the ending.', focus: 'Recognition, manifest fate, Penelope and Saga lore.', rows: [[90,1],[51,1],[76,1],[174,1],[79,1],[16,1],[208,1],[217,1],[36,1],[116,3],[87,2],[9,1],[10,1],[139,1],[108,1],[228,1],[5,1],[8,1],[94,1],[113,1],[70,1],[251,3],[252,2],[253,2],[254,3],[255,3],[256,3]] },
    { code: 'BG', name: 'The Orchard and the Underworld', tagline: 'Tend the living household; bring its memories back from the dead.', focus: 'Household workers, graveyard returns, Bestow and Escape.', rows: [[125,2],[126,2],[130,2],[179,1],[214,2],[220,2],[58,1],[158,1],[231,1],[26,2],[168,1],[194,1],[27,1],[162,1],[171,1],[129,1],[212,1],[271,1],[257,3],[258,3],[259,3],[263,1],[264,2],[265,2],[266,2]] },
    { code: 'RW', name: 'From Troy to the Great Hall', tagline: 'Crew the ships, bring the warriors home, and reclaim the hall.', focus: 'Attackers versus crew, Survival, ships and the Wooden Horse.', rows: [[103,1],[9,1],[108,2],[227,2],[12,2],[132,2],[59,1],[177,1],[57,1],[298,1],[64,1],[85,1],[186,1],[38,1],[67,1],[8,1],[44,1],[229,1],[92,1],[272,1],[251,2],[252,3],[253,3],[260,3],[261,3],[262,2]] },
    { code: 'RG', name: 'Hold Fast Through the Islands', tagline: 'Take the risk, save the crew, and meet the monsters with force.', focus: 'Island ordeals, Survival mana, fighting and Achilles\' wrath.', rows: [[48,1],[50,2],[227,1],[178,1],[32,1],[140,2],[133,1],[88,1],[137,1],[173,1],[222,1],[54,1],[134,1],[145,1],[180,1],[67,1],[74,1],[41,1],[161,1],[289,1],[171,1],[267,1],[263,3],[264,2],[265,2],[266,2],[260,2],[261,2],[262,3]] }
  ].map(deck => Object.freeze({ ...deck, rows: Object.freeze(deck.rows.map(row => Object.freeze(row))) }));
  Object.freeze(DECKS);
  const ORIGIN = root.location.protocol === 'https:' ? root.location.origin : 'https://kliawota.design';
  const SCALE = 63 * 96 / 25.4 / 378;
  const PRINT_PDF_URL = 'https://kliawota.design/mtgtools/odyssey/downloads/Odyssey_Four_Draft_Decks_Studio_2026-10-14.pdf';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  const cssSafe = value => String(value).replace(/<\/style/gi, '<\\/style');
  const scriptSafe = value => JSON.stringify(value).replace(/</g, '\\u003c');
  const nameOf = model => model.displayName || model.name || ('Card ' + model.number);
  const tick = () => new Promise(resolve => root.requestAnimationFrame(resolve));
  let dialog, status, downloadButton, printButton, retryButton, preview, prepared, pending;

  function absoluteHTTPS(value, base = root.location.href) {
    if (!value) return '';
    const url = new URL(value, base);
    if (url.protocol === 'http:' && url.origin === root.location.origin) {
      return new URL(url.pathname + url.search + url.hash, ORIGIN).href;
    }
    if (url.protocol !== 'https:') throw new Error('Artwork needs its existing HTTPS source: ' + value);
    return url.href;
  }
  function absoluteCSS(text, base) {
    return text.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi, (match, quote, value) => {
      if (/^(data:|blob:|#)/i.test(value)) return match;
      try { return 'url("' + absoluteHTTPS(value, base).replace(/"/g, '%22') + '")'; }
      catch (_) { return match; }
    });
  }
  function capturedCSS() {
    // Keep the native screen architecture at 378 x 528. Studio's print media
    // combines family-specific pixels with millimetres, so it is not copied.
    const pieces = [];
    function read(rules, base) {
      for (const rule of rules) {
        if (rule.type === 4) {
          if (/\bprint\b/i.test(rule.conditionText || rule.media?.mediaText || '')) continue;
          if (/\bscreen\b/i.test(rule.conditionText || '') && root.matchMedia(rule.conditionText).matches) {
            read(rule.cssRules, base);
          } else {
            const children = [];
            const start = pieces.length;
            read(rule.cssRules, base);
            children.push(...pieces.splice(start));
            if (children.length) pieces.push('@media ' + rule.conditionText + '{' + children.join('\n') + '}');
          }
        } else if (rule.type === 3 && rule.styleSheet) {
          try { read(rule.styleSheet.cssRules, rule.href || base); } catch (_) { /* cross-origin UI styles */ }
        } else if (rule.cssRules && rule.cssText.startsWith('@supports')) {
          const start = pieces.length;
          read(rule.cssRules, base);
          const children = pieces.splice(start);
          if (children.length) pieces.push('@supports ' + rule.conditionText + '{' + children.join('\n') + '}');
        } else if (rule.cssText && !rule.cssText.startsWith('@page')) {
          pieces.push(absoluteCSS(rule.cssText, base));
        }
      }
    }
    for (const sheet of document.styleSheets) {
      if (sheet.ownerNode?.id === 'odDraftDeckStyles') continue;
      try { read(sheet.cssRules, sheet.href || root.location.href); } catch (_) { /* inaccessible unrelated sheet */ }
    }
    if (!pieces.some(piece => piece.includes('.render-card'))) throw new Error('Native Studio card styles are unavailable. Reload Studio and retry.');
    return pieces.join('\n');
  }
  function fixedNativeShell(shell) {
    shell.style.cssText += ';position:relative!important;width:378px!important;height:528px!important;max-width:none!important;max-height:none!important;transform:none!important;filter:none!important;margin:0!important;flex:none!important';
    const card = shell.querySelector('.render-card');
    if (!card) throw new Error('Studio did not return a native card.');
    return card;
  }
  function waitForImages(records) {
    return Promise.all(records.map(record => new Promise(resolve => {
      const image = record.image;
      let timer;
      const finish = () => { root.clearTimeout(timer); image.removeEventListener('load', finish); image.removeEventListener('error', finish); resolve(); };
      if (image.complete) return resolve();
      image.addEventListener('load', finish, { once:true });
      image.addEventListener('error', finish, { once:true });
      timer = root.setTimeout(finish, 30000);
    })));
  }
  function cardSnapshot(shell, model, edgePaints) {
    const clone = shell.cloneNode(true);
    // Zoom scales both layout and paint. Chromium otherwise fragments a
    // transformed 528px layout box before painting its 88mm card.
    clone.style.setProperty('position', 'absolute', 'important');
    clone.style.setProperty('left', '0', 'important');
    clone.style.setProperty('top', '0', 'important');
    clone.style.setProperty('transform', 'none', 'important');
    clone.style.setProperty('zoom', String(SCALE), 'important');
    clone.style.setProperty('transform-origin', '0 0', 'important');
    clone.querySelectorAll('.art-options-trigger').forEach(node => node.remove());
    const originals = [...shell.querySelectorAll('img')];
    clone.querySelectorAll('img').forEach((image, index) => {
      image.removeAttribute('srcset');
      image.loading = 'eager'; image.decoding = 'sync';
      const source = originals[index].currentSrc || originals[index].src;
      if (source) image.src = absoluteHTTPS(source);
    });
    // A clone carries canvas elements but never their pixels. Repaint the native
    // nine-slice edge continuation from the same HTTPS image on reopening. This
    // uses no pixel reads, so cross-origin artwork remains supported.
    const originalCanvases = [...shell.querySelectorAll('canvas')];
    const clonedCanvases = [...clone.querySelectorAll('canvas')];
    if (originalCanvases.length) {
      for (const name of ['drawArtEdgeSamples','artViewportMetrics','artPanPixels','artEdgeGeometry']) {
        if (typeof root[name] !== 'function') throw new Error('Native artwork edge replay is unavailable (' + name + '). Reload Studio and retry.');
      }
      const captured = new Set();
      for (const artbox of shell.querySelectorAll('.artbox')) {
        const state = artbox._artEdgeFill;
        if (!state) continue;
        const image = artbox.querySelector('.art-img');
        const met = root.artViewportMetrics(image, artbox, model);
        if (!met || !state.sample || !state.blur) throw new Error('Native artwork edge geometry is unavailable for ' + nameOf(model) + '.');
        const pan = root.artPanPixels(met, model);
        const geo = root.artEdgeGeometry(met, pan);
        const unit = Math.min(met.W, met.H) / 350;
        const gap = Math.max(...Object.values(geo.gaps));
        const radius = Math.min(26 * unit, .65 * unit + gap * .4);
        const pad = 3 * radius;
        const scale = Math.min(4, Math.max(2, 1056 / met.H));
        const width = Math.ceil((met.W + pad * 2) * scale);
        const height = Math.ceil((met.H + pad * 2) * scale);
        const id = 'od-deck-edge-' + edgePaints.length;
        for (const [role, canvas] of [['sample',state.sample],['blur',state.blur]]) {
          const index = originalCanvases.indexOf(canvas);
          if (index < 0 || !clonedCanvases[index]) throw new Error('Native artwork edge canvas is unavailable for ' + nameOf(model) + '.');
          clonedCanvases[index].dataset.deckPaint = id + '-' + role;
          captured.add(canvas);
        }
        edgePaints.push({ id, source:absoluteHTTPS(image.currentSrc || image.src), met, pan, geo, pad, scale, width, height, label:nameOf(model) });
      }
      if (captured.size !== originalCanvases.length) throw new Error('An unsupported native canvas would lose its paint in ' + nameOf(model) + '.');
    }
    return clone.outerHTML;
  }
  function preparedHTML(pages, css, issues, edgePaints) {
    const sourceTime = new Date().toLocaleString('en-GB', { timeZone:'Pacific/Efate' });
    const guide = '<section class="od-deck-guide"><h1>The Odyssey: four draft decks</h1><p>Each deck has 40 cards: 23 spells and 17 lands. Key commons repeat up to three times; other nonbasic cards are singleton within each deck.</p><p>Includes all 16 chosen basic-land versions, with their saved Studio crops.</p>' + DECKS.map(deck => '<article><h2>' + escapeHTML(deck.code + ' · ' + deck.name) + '</h2><p>' + escapeHTML(deck.tagline) + '</p><p><b>Test:</b> ' + escapeHTML(deck.focus) + '</p></article>').join('') + '<p><b>Print A4, single-sided, Actual size / 100%.</b> Turn off Fit to page. Set Background graphics On and browser Headers and footers Off. Each card is 63 × 88 mm. Cut on the rectangle borders and sleeve over backing cards. The Wooden Horse reverse is an extra support face, outside the 40-card deck.</p><p>Deck selection: 14 October 2026. Card text, art and crops: current Studio, captured ' + escapeHTML(sourceTime) + ' Pacific/Efate.</p>' + (issues.unassigned.length ? '<p>Artwork unassigned in Studio: ' + issues.unassigned.map(escapeHTML).join('; ') + '. These faces retain Studio’s unassigned-art presentation.</p>' : '') + '<p>Suggested first games: WU vs RG and BG vs RW; then swap opponents.</p><p class="od-calibration">This line must measure 50 mm.</p></section>';
    const sheets = pages.map((page, index) => '<section class="od-deck-page"><header>' + escapeHTML(page.code + ' · ' + page.name + ' · sheet ' + page.sheet + '/5') + '</header><div class="od-deck-grid">' + page.cards.map(card => '<div class="od-deck-slot">' + card + '</div>').join('') + '</div><footer>Odyssey Studio · 63 × 88 mm · 100% / Actual Size · sheet ' + (index + 1) + '/' + pages.length + '</footer></section>').join('');
    const exportCSS = `
      @page{size:A4;margin:0}
      html,body{margin:0!important;padding:0!important;background:#e9e9e7!important;min-height:0!important;color:#242424!important}
      .od-deck-toolbar{position:sticky;top:0;z-index:100;background:#fff;padding:12px 20px;border-bottom:1px solid #bbb;font:14px/1.4 Arial,sans-serif}
      .od-deck-toolbar button{padding:8px 12px;margin-right:10px;font:700 14px Arial,sans-serif}
      .od-deck-guide{box-sizing:border-box;width:210mm;min-height:297mm;margin:12px auto;padding:18mm;background:#fff;font:11pt/1.4 Arial,sans-serif;break-after:page;page-break-after:always}
      .od-deck-guide h1{font-size:23pt;margin:0 0 8mm}.od-deck-guide h2{font-size:14pt;margin:0 0 2mm}.od-deck-guide article{margin:0 0 7mm}.od-deck-guide article p{margin:1mm 0}
      .od-calibration{width:50mm;border-top:1px solid #222;padding-top:2mm;font-size:8pt}
      .od-deck-page{box-sizing:border-box;position:relative;width:210mm;height:297mm;margin:12px auto;padding:16.5mm 10.5mm;background:#fff;break-after:page;page-break-after:always;overflow:hidden}
      .od-deck-page:last-child{break-after:auto;page-break-after:auto}
      .od-deck-page>header{position:absolute;left:10.5mm;top:5mm;font:9pt Arial,sans-serif;color:#333}
      .od-deck-page>footer{position:absolute;left:10.5mm;bottom:5mm;font:7pt Arial,sans-serif;color:#555}
      .od-deck-grid{display:grid;grid-template-columns:repeat(3,63mm);grid-template-rows:repeat(3,88mm);width:189mm;height:264mm;gap:0}
      .od-deck-slot{box-sizing:border-box;position:relative;width:63mm;height:88mm;outline:.15mm solid #777;overflow:hidden;break-inside:avoid}
      .od-deck-slot>.card-shell{position:absolute!important;left:0!important;top:0!important;width:378px!important;height:528px!important;max-width:none!important;max-height:none!important;transform:none!important;zoom:${SCALE}!important;transform-origin:0 0!important;filter:none!important;margin:0!important}
      .od-deck-slot>.card-shell>.render-card{width:378px!important;height:528px!important;inset:0!important}
      .od-deck-grid .art-options-trigger{display:none!important}
      *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
      @media print{html,body{background:#fff!important}.od-deck-toolbar{display:none!important}.od-deck-guide,.od-deck-page{margin:0!important;box-shadow:none!important}}
    `;
    const boot = `
      (function(){
        const status=document.getElementById('odDeckFileStatus'),button=document.getElementById('odDeckFilePrint');
        button.onclick=()=>{location.href=${scriptSafe(PRINT_PDF_URL)};};
        const paints=${scriptSafe(edgePaints)};
        const drawArtEdgeSamples=${edgePaints.length ? '(' + root.drawArtEdgeSamples.toString() + ')' : 'null'};
        const images=[...document.images];
        Promise.race([Promise.all(images.map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true});}))),new Promise(resolve=>setTimeout(resolve,30000))]).then(async()=>{
          await document.fonts.ready;
          const failed=images.filter(image=>!image.complete||!image.naturalWidth);
          const errors=failed.map(image=>image.src);
          let painted=0;
          if(!failed.length)for(const paint of paints){
            try{
              const sample=document.querySelector('[data-deck-paint="'+paint.id+'-sample"]');
              const blur=document.querySelector('[data-deck-paint="'+paint.id+'-blur"]');
              const image=sample?.closest('.artbox')?.querySelector('.art-img');
              if(!sample||!blur||!image?.complete||!image.naturalWidth||image.src!==paint.source)throw Error('Artwork edge replay source is unavailable: '+paint.label);
              sample.width=blur.width=paint.width;sample.height=blur.height=paint.height;
              const ctx=sample.getContext('2d'),blurCtx=blur.getContext('2d');
              if(!ctx||!blurCtx||!drawArtEdgeSamples)throw Error('Artwork edge replay context is unavailable: '+paint.label);
              drawArtEdgeSamples(ctx,image,paint.met,paint.geo,paint.width,paint.height,paint.pad,paint.scale);
              blurCtx.drawImage(sample,0,0);
              ctx.clearRect((paint.geo.left+paint.pad)*paint.scale,(paint.geo.top+paint.pad)*paint.scale,paint.met.rw*paint.scale,paint.met.rh*paint.scale);
              painted++;
            }catch(error){errors.push(error.message);}
          }
          await new Promise(requestAnimationFrame);
          status.textContent=errors.length?'Current Studio artwork could not be completely painted. Reload this prepared file to retry. '+errors.join('; '):'Ready: 160 deck cards and the Wooden Horse reverse. A4, 100% / Actual Size.';
          button.disabled=!!errors.length;
          window.__odysseyDeckSheetsReady=!errors.length&&painted===paints.length;
          window.__odysseyDeckSheetsIssues=errors;
          window.__odysseyDeckEdgePaints={expected:paints.length,painted};
        }).catch(error=>{status.textContent='Could not paint current Studio artwork: '+error.message;button.disabled=true;window.__odysseyDeckSheetsReady=false;window.__odysseyDeckSheetsIssues=[error.message];});
      })();
    `;
    return '<!doctype html><html lang="en" class="' + escapeHTML(document.documentElement.className) + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Odyssey — four prepared draft decks</title><style>' + cssSafe(css) + '</style><style>' + cssSafe(exportCSS) + '</style></head><body class="' + escapeHTML(document.body.className) + '"><div class="od-deck-toolbar"><a href="' + escapeHTML(PRINT_PDF_URL) + '" download>Download print PDF</a> <button id="odDeckFilePrint" disabled>Open print PDF</button><span id="odDeckFileStatus">Loading current Studio artwork…</span></div>' + guide + sheets + '<script>' + boot.replace(/<\/script/gi, '<\\/script') + '</script></body></html>';
  }
  function showIssues(issues) {
    const notes = [];
    if (issues.unassigned.length) notes.push('Art unassigned: ' + issues.unassigned.join('; ') + '. Studio’s existing presentation is retained.');
    if (issues.images.length) notes.push('Assigned artwork did not load: ' + issues.images.join('; ') + '. Retry preparation before printing.');
    if (issues.overflow.length) notes.push('Studio reports text that needs attention: ' + issues.overflow.join('; ') + '. Printing is paused until the native card fits.');
    status.textContent = notes.length ? notes.join(' ') : 'Ready: 160 deck cards plus the Wooden Horse reverse. Live Studio text, art and crops captured.';
    status.dataset.state = issues.images.length || issues.overflow.length ? 'error' : 'ready';
  }
  async function prepare() {
    if (!dialog) createDialog();
    if (pending) return pending;
    pending = (async () => {
      downloadButton.disabled = printButton.disabled = true;
      retryButton.disabled = true;
      prepared = null;
      status.textContent = 'Preparing native Studio cards and loading their current artwork…';
      status.dataset.state = 'loading';
      const stage = document.createElement('div');
      stage.className = 'od-draft-capture';
      stage.style.cssText = 'position:fixed;left:-10000px;top:0;width:378px;height:528px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1';
      document.body.append(stage);
      try {
        const rendered = [], images = [], pages = [], edgePaints = [];
        const issues = { images:[], unassigned:[], overflow:[] };
        for (const deck of DECKS) {
          if (deck.rows.reduce((sum, row) => sum + row[1], 0) !== 40) throw new Error(deck.code + ' deck count is not 40.');
          const faces = deck.rows.flatMap(([number, count]) => Array.from({ length:count }, () => ({ number, face:'front' })));
          if (faces.some(face => face.number === 229)) faces.push({ number:229, face:'back' });
          for (let start = 0; start < faces.length; start += 9) {
            const page = { code:deck.code, name:deck.name, sheet:1 + Math.floor(start / 9), cards:[] };
            pages.push(page);
            for (const entry of faces.slice(start, start + 9)) {
              const source = root.model(entry.number);
              if (!source?.name || !source.rules) throw new Error('Current Studio card ' + entry.number + ' is unavailable.');
              const model = root.OdysseyTransformFaces?.face ? root.OdysseyTransformFaces.face(source, entry.face) : source;
              if (entry.face === 'back' && model === source) throw new Error('The native Wooden Horse reverse is unavailable.');
              const shell = root.makeCardShell(model);
              const card = fixedNativeShell(shell);
              stage.append(shell);
              const label = String(entry.number).padStart(3, '0') + ' · ' + nameOf(model);
              const artwork = [...shell.querySelectorAll('.art-img')];
              if (!model.artId && !artwork.length && !issues.unassigned.includes(label)) issues.unassigned.push(label);
              for (const image of shell.querySelectorAll('img')) {
                image.loading = 'eager'; image.decoding = 'sync';
                if (image.src) image.src = absoluteHTTPS(image.src);
                images.push({ image, label, isArtwork:image.classList.contains('art-img') });
              }
              rendered.push({ shell, card, model, label, page });
            }
          }
        }
        await waitForImages(images);
        await document.fonts.ready;
        for (let pass = 0; pass < 2; pass++) {
          for (const item of rendered) {
            root.fitCardTypography(item.card);
            if (root.applyArtView) for (const image of item.shell.querySelectorAll('.art-img')) root.applyArtView(image, item.model);
          }
          await tick();
        }
        for (const record of images) {
          if ((!record.image.complete || !record.image.naturalWidth) && !issues.images.includes(record.label)) issues.images.push(record.label);
        }
        for (const item of rendered) {
          if (item.card.querySelector('.rules')?.dataset.fitState === 'overflow' || item.card.querySelector('.name')?.dataset.fitState === 'overflow') {
            if (!issues.overflow.includes(item.label)) issues.overflow.push(item.label);
          }
          item.page.cards.push(cardSnapshot(item.shell, item.model, edgePaints));
        }
        showIssues(issues);
        if (!issues.images.length && !issues.overflow.length) {
          prepared = { html:preparedHTML(pages, capturedCSS(), issues, edgePaints), issues, pages:pages.length, faces:rendered.length };
          preview.srcdoc = prepared.html;
          preview.hidden = false;
          downloadButton.disabled = printButton.disabled = false;
        } else {
          preview.removeAttribute('srcdoc'); preview.hidden = true;
        }
        return { ready:!!prepared, issues, faces:rendered.length, sheets:pages.length };
      } catch (error) {
        status.textContent = 'Could not prepare the deck sheets: ' + error.message;
        status.dataset.state = 'error';
        preview.removeAttribute('srcdoc'); preview.hidden = true;
        throw error;
      } finally {
        stage.remove(); retryButton.disabled = false;
      }
    })();
    try { return await pending; } finally { pending = null; }
  }
  function download() {
    if (!prepared) return;
    const url = URL.createObjectURL(new Blob([prepared.html], { type:'text/html;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'Odyssey_Four_Draft_Decks_Studio.html';
    document.body.append(anchor); anchor.click(); anchor.remove();
    root.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function createDialog() {
    dialog = document.createElement('dialog'); dialog.id = 'odDraftDeckDialog';
    dialog.setAttribute('aria-labelledby', 'odDraftDeckTitle');
    dialog.innerHTML = '<div class="od-draft-head"><div><h2 id="odDraftDeckTitle">Four Odyssey draft decks</h2><p>40 cards each · 23 spells + 17 lands · deck selection 14 October 2026</p></div><button class="btn secondary" data-close>Close</button></div><p>The print PDF was prepared from Studio on 14 October 2026, with artwork and frames embedded. Download it directly, or prepare editable HTML sheets from your current Studio.</p><p>Prepare the cards using the text, artwork and crops currently shown in your Studio. Print A4, single-sided, at 100% / Actual Size, with Background graphics On and browser Headers and footers Off.</p><div class="od-draft-actions"><a class="btn" href="' + escapeHTML(PRINT_PDF_URL) + '" download>Download print PDF</a><button class="btn secondary" data-download disabled>Download prepared deck sheets</button><button class="btn secondary" data-print>Open print PDF</button><button class="btn secondary" data-retry>Prepare / retry</button></div><p data-status role="status" aria-live="polite"></p><div class="od-draft-lists"></div><iframe title="Prepared Odyssey deck sheets" hidden></iframe>';
    const lists = dialog.querySelector('.od-draft-lists');
    for (const deck of DECKS) {
      const section = document.createElement('section');
      section.innerHTML = '<h3>' + escapeHTML(deck.code + ' · ' + deck.name) + '</h3><p>' + escapeHTML(deck.tagline) + '</p><p><b>Test:</b> ' + escapeHTML(deck.focus) + '</p><ul>' + deck.rows.map(([number, count]) => '<li><b>' + count + '</b> ' + escapeHTML(nameOf(root.model(number))) + '</li>').join('') + '</ul>';
      lists.append(section);
    }
    status = dialog.querySelector('[data-status]');
    downloadButton = dialog.querySelector('[data-download]');
    printButton = dialog.querySelector('[data-print]');
    retryButton = dialog.querySelector('[data-retry]');
    preview = dialog.querySelector('iframe');
    dialog.querySelector('[data-close]').onclick = () => dialog.close();
    downloadButton.onclick = download;
    retryButton.onclick = () => prepare().catch(() => {});
    printButton.onclick = () => { root.open(PRINT_PDF_URL, '_blank', 'noopener'); };
    document.body.append(dialog);
  }
  function open() {
    if (!dialog) createDialog();
    if (!dialog.open) dialog.showModal();
    if (!prepared && !pending) { status.textContent = 'The print PDF is ready. It contains 160 cards and the Wooden Horse reverse on 21 A4 pages. Use Prepare / retry for current HTML sheets.'; printButton.disabled = false; }
  }
  function install(attempt = 0) {
    if (!root.model || !root.makeCardShell || !root.fitCardTypography || !document.querySelector('.top-actions')) {
      if (attempt < 150) root.setTimeout(() => install(attempt + 1), 100);
      return;
    }
    if (document.getElementById('odDraftDeckButton')) return;
    const style = document.createElement('style'); style.id = 'odDraftDeckStyles';
    style.textContent = '#odDraftDeckDialog{box-sizing:border-box;width:min(1200px,calc(100vw - 28px));max-height:92dvh;overflow:auto;border:1px solid #716446;border-radius:12px;padding:22px;background:#1b1e18;color:#efefe7;font:14px/1.45 system-ui,sans-serif}#odDraftDeckDialog a.btn{text-decoration:none;display:inline-flex;align-items:center}#odDraftDeckDialog::backdrop{background:#000b}#odDraftDeckDialog h2{margin:0;font-size:23px}#odDraftDeckDialog h3{margin:0 0 5px;font-size:17px}#odDraftDeckDialog p{margin:7px 0 12px}.od-draft-head{display:flex;align-items:start;justify-content:space-between;gap:18px}.od-draft-actions{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.od-draft-lists{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.od-draft-lists>section{padding:15px;border:1px solid #484e40;border-radius:8px}.od-draft-lists ul{list-style:none;padding:0;margin:12px 0;font-size:13px}.od-draft-lists li{margin:3px 0}.od-draft-lists li>b{display:inline-block;min-width:18px}#odDraftDeckDialog [data-status][data-state=error]{color:#f1ba9f}#odDraftDeckDialog iframe{display:block;width:100%;height:460px;border:1px solid #777;background:white;margin-top:20px}#odDraftDeckDialog iframe[hidden]{display:none}@media(max-width:650px){.od-draft-lists{grid-template-columns:1fr}#odDraftDeckDialog{padding:15px}}';
    document.head.append(style);
    const button = document.createElement('button');
    button.id = 'odDraftDeckButton'; button.className = 'btn secondary'; button.textContent = 'Draft decks'; button.onclick = open;
    document.querySelector('.top-actions').append(button);
  }
  root.OdysseyDraftDecks = Object.freeze({ open, prepare, decks:DECKS, selectionDate:'2026-10-14' });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => install(), { once:true });
  else install();
})(window);

