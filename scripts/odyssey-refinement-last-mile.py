"""Put comma-separated standalone keyword abilities on individual lines, without splitting normal rules clauses."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'public/mtgtools/odyssey/design-refinement.js';s=p.read_text()
old='  flush();return out;'
new=r'''  flush();
  const keyword=/^(?:flying|reach|vigilance|flash|haste|trample|menace|lifelink|deathtouch|first strike|double strike|defender|indestructible|hexproof|shroud)$/i;
  return out.flatMap(line=>{
   const period=line.endsWith('.'),parts=line.replace(/\.$/,'').split(/\s*,\s*/);
   if(parts.length<2||!parts.every(part=>keyword.test(part)))return [line];
   return parts.map((part,i)=>part[0].toUpperCase()+part.slice(1)+(period&&i===parts.length-1?'.':''));
  });'''
if old in s:p.write_text(s.replace(old,new,1))
t=ROOT/'tests/odyssey-refinement.test.cjs';tests=t.read_text()
extra="""
test('standalone keyword abilities get separate returns without splitting ability clauses',()=>{assert.deepEqual(ref.sentences('Reach, vigilance. Whenever you scry, draw a card.'),['Reach','Vigilance.','Whenever you scry, draw a card.']);assert.deepEqual(ref.sentences('Flash, flying'),['Flash','Flying']);assert.deepEqual(ref.sentences('Flying. Whenever a creature enters, you gain 1 life.'),['Flying.','Whenever a creature enters, you gain 1 life.']);});
"""
if "test('standalone keyword abilities" not in tests:t.write_text(tests+extra)
print('Standalone keyword lists now have one return per ability; normal commas, reminders and saved card rules remain unchanged.')
