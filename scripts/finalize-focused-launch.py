"""Final art-direction corrections after inspecting real browser screenshots."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]/'public/mtgtools/Odyssey/scry'
p=R/'focused-launch.js';s=p.read_text()
start=s.index(" {id:'landfalls',")
end=s.index("\n {id:'relics',",start)
s=s[:start]+" {id:'landfalls',tab:'Troy to Ithaca',name:'From Troy\\nto Ithaca.',hook:'The voyage changes the shape of your cards.',text:'The Siege of Troy transforms into the Wooden Horse. Adventure lands carry an episode on their way into your mana base. Revisit the war, remember the oath, and build your route home.',tags:['Transforming Sagas','Adventure lands'],featured:[229,188],artId:'ART-053',position:'65% 38%',mood:'paper',match:c=>cycle(c,'ff-analog-adventure-lands')||String(c.rules||'').includes('//BACK//')},"+s[end:]
old="$('developmentImage').style.backgroundImage='url(\"'+invitation.image+'\")';"
assert s.count(old)==1;s=s.replace(old,'')
p.write_text(s)
p=R/'focused-launch.css';s=p.read_text()
old='.launch-invitation .section-art img{width:100%;max-width:none;height:100%;object-fit:cover;object-position:var(--art-position);transform:translateX(22%)}'
new='.launch-invitation .section-art img{width:140%;max-width:none;height:100%;object-fit:cover;object-position:var(--art-position);transform:none}'
assert s.count(old)==1;s=s.replace(old,new)
old='.launch-invitation .section-art img{transform:translateX(28%)}'
new='.launch-invitation .section-art img{width:150%;transform:none}'
assert s.count(old)==1;s=s.replace(old,new)
p.write_text(s)
print('Draper is one continuous crop, with no repeated-image seam. Troy is part of the main set tour.')
