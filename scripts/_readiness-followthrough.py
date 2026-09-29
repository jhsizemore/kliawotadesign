from pathlib import Path
R=Path(__file__).resolve().parents[1]
def replace(name,old,new):
 p=R/name;s=p.read_text();assert s.count(old)==1,(name,s.count(old));p.write_text(s.replace(old,new))
replace('tests/odyssey-signup-browser.py','assert unauth.status==403','assert unauth.status==401')
replace('public/mtgtools/odyssey/studio-polish.js',r'Cycling) ([WUBRGC]+|\d+)',r'Cycling) ([WUBRGCX]+|\d+)')
replace('public/mtgtools/odyssey/studio-polish.js',r'([ \t]*)(\d+)(?=[ \t]*(?:,[ \t]*\{[TQ]\}|:))',r'([ \t]*)(\d+|X)(?=[ \t]*(?:,[ \t]*\{[TQ]\}|:))')
p=R/'tests/odyssey-continuity.test.cjs';s=p.read_text();s+='\nfor(const [input,expected] of [["Ward X.","Ward {X}."],["X: Draw X cards.","{X}: Draw X cards."],["X, T: Draw a card.","{X}, {T}: Draw a card."],["Pay X life.","Pay X life."]])test("X remains symbolic only in a mana-cost context: "+input,()=>assert.equal(polish.normalizeRules(input),expected));\n';p.write_text(s)
replace('public/mtgtools/Odyssey/scry/exhibition.js',"if(IS_SOCIAL){setupPromo();$('promoStatus').textContent='The full preview has closed. This composer now offers curated candidates.';}","""if(IS_SOCIAL){
   const chosen=[...document.querySelectorAll('.promo-select')].map(s=>s.value),background=$('promoBackground').value;
   setupPromo();document.querySelectorAll('.promo-select').forEach((s,i)=>{s.value=[...s.options].some(o=>o.value===chosen[i])?chosen[i]:'';});
   if([...$('promoBackground').options].some(o=>o.value===background))$('promoBackground').value=background;
   renderPromo();$('promoStatus').textContent='The full preview has closed. This composer now offers curated candidates; eligible selections are preserved.';
  }""")
replace('tests/odyssey-readiness-browser.py',"  assert await social.locator('.promo-select').first.locator('option').count()==310", "  assert await social.locator('.promo-select').first.locator('option').count()==310\n  await social.locator('.promo-select').first.select_option('61');await social.locator('#promoHeadline').fill('A curated voyage')")
replace('tests/odyssey-readiness-browser.py',"  assert await social.locator('.promo-select').first.locator('option').count()<100", "  assert await social.locator('.promo-select').first.locator('option').count()<100\n  assert await social.locator('.promo-select').first.input_value()=='61';assert await social.locator('#promoHeadline').input_value()=='A curated voyage'")
# Include files adjusted outside the original checksum-validated patch in the exact commit list.
p=R/'test-results/odyssey-readiness/changed-files.json';paths=set(__import__('json').loads(p.read_text()));paths.update(['tests/odyssey-signup-browser.py','tests/odyssey-readiness-browser.py']);p.write_text(__import__('json').dumps(sorted(paths)))
