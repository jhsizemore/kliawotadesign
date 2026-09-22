import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('refs',Path(__file__).resolve().parents[1]/'scripts/odyssey-build-reference-cards.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Eligibility(unittest.TestCase):
 def test_playtest_future_acorn_and_digital_excluded(self):
  c={'games':['paper'],'released_at':'2025-01-01','legalities':{'legacy':'legal'},'layout':'normal'}
  self.assertTrue(m.eligible(c,'2026-09-22'))
  for patch in [{'promo_types':['playtest']},{'released_at':'2027-01-01'},{'security_stamp':'acorn'},{'games':['arena']},{'layout':'art_series'}]:
   self.assertFalse(m.eligible(c|patch,'2026-09-22'),patch)
 def test_battlefield_and_contest_do_not_trigger_unrelated_mechanics(self):
  c={'name':'Contest of the Bow','rules':'Return a creature to the battlefield.','type':'Sorcery','mechanics':''}
  self.assertEqual(m.technology(c),[])
 def test_multimechanic_card_preserves_all_technologies(self):
  c={'name':'Ordeal of the Sirens','mana':'{1}{U}','type':'Enchantment — Aura','rules':'Survival. When you sacrifice it, manifest fate.'}
  names=[n for n,_ in m.technology(c)]
  self.assertIn('Ordeal of Thassa',names);self.assertIn('Kona, Rescue Beastie',names);self.assertIn('Hauntwoods Shrieker',names)
if __name__=='__main__':unittest.main()
