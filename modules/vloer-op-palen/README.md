# Bedrijfsvloer op palen (FEM, ponskop, stroken, krimp)

*Pile-supported industrial floor: Open FEM Studio calculates a floor patch including its
edge, as a flat slab, with drop panels, with thickened strips, or a combination. The sheet
shows the distribution of forces (m_x, m_y, m_xy and the deflection), designs the
reinforcement at nine or ten points with the three-layer model, checks the crack width
under the frequent combination, and states what the calculation model is. It also gives
the moments per zone, the complete reinforcement around a pile in 3D, the pile reactions
for punching, and shrinkage.*

Een betonvloer op palen in een regelmatig raster. Open FEM Studio rekent een stuk vloer
met de vloerrand als plaatmodel; het blad maakt het model, toont de krachtsverdeling,
rekent op negen of tien punten de wapening met het drielagenmodel en de scheurwijdte, en
geeft de paalreacties en wat krimp betekent voor een lange vloer zonder voeg. Alle
FEM en alle toetsen komen uit Open FEM Studio; het blad heeft geen eigen rekenkern.
Vraagt een app met de blokken `@fem` en `@kern` (2026.46.0) en Open FEM Studio.

## Het rekenmodel

**Wat er gerekend is.** De krachtsverdeling komt uit een **lineair-elastische**
plaatberekening (`solve_open_fem_3d`): vierhoekige schaalelementen (MITC4,
Mindlin-Reissner, dus met dwarskrachtvervorming), met de ongescheurde stijfheid
E_cm·t³/12 per plaat en ν = 0,2. Geometrisch lineair en fysisch lineair: scheurvorming,
vloeien en de herverdeling daardoor zitten niet in de krachtsverdeling. Het blad zegt
dat op het scherm en op papier.

**Fysisch niet-lineair (FNL), geometrisch lineair (GL)** is de bedoeling voor deze
vloer, maar Open FEM Studio rekent een plaat met gescheurd beton en wapening nog niet.
Nagegaan op de geïnstalleerde server 2026.44.2 en in de bron van 2026.46.0:

- `solve_open_fem_3d` kent voor `analysis` alleen `linear` en `p-delta` en rekent een
  model met platen alleen lineair; tweede orde met platen weigert het;
- `solve_native_fem` met `hybridPlate` kent een stijfheid die per element afneemt met de
  rek, maar dat is een opgegeven E(ε)-curve, isotroop en zonder wapening: geen scheurwet;
- `hybridPlateLayered` rekent alleen elastische lagen, en de kern met vezellagen
  (`hybridPlateFiber`) rekent staal met vloeien en weigert beton met een scheurwet.

De keuze staat wel in het blad (**Krachtsverdeling in het rekenmodel**: lineair-elastisch
of fysisch niet-lineair). FNL zet `analyse fysisch-niet-lineair` in het `@fem`-blok; dat
blok weigert die analyse, dus er wordt niets gerekend en nergens staat een uitkomst,
nooit een lineaire uitkomst onder een andere naam. Zodra FEM Studio en het `@fem`-blok de
analyse kennen, rekent het blad met dezelfde invoer niet-lineair. De variant `fnl` in de
testgegevens bewaakt dit.

**Wat lineair-elastisch betekent.** De wapening op de elastische momenten is een
evenwichtsstelsel en daarmee een veilige verdeling, maar de pieken boven de palen zijn
hoger en de veldmomenten lager dan in een gescheurde vloer. De doorbuiging is die van de
ongescheurde plaat zonder kruip: een ondergrens.

**Geometrie.** Een vloer van n × n velden (3 tot 5, standaard 4) met de vloerrand rondom:
hoekvelden, randvelden en binnenvelden; de buitenste paalrij ligt a_r binnen de rand
(standaard 0,3 m). Te combineren: een vlakke plaat, een ponskop boven elke paal
(vierkant, breedte b_k, dikte t_k) en versterkte stroken over de paalrijen in x, in y of
beide (breedte b_s, dikte t_s). De bovenkant is vlak; platen van verschillende dikte
liggen tegen elkaar, delen hun knopen en hebben hetzelfde middenvlak (geen
excentriciteit). De maas is L/12, grover als het raster anders meer dan 8000 knopen
krijgt (het blad waarschuwt boven L/8).

**Palen.** Een paal is een lineaire veer k, gelijk verdeeld over de knopen binnen de
paalkop; de rand van de kop is een rasterlijn. Een paal die trekt, blijft meedoen: het
blad meldt het als de kleinste paalreactie negatief is. De vloerrand is vrij.

**Belastingen en combinaties.** Vier belastinggevallen: eigen gewicht (25 kN/m³ maal de
dikte ter plaatse), afwerking, en het veranderlijke deel op de velden van schaakbord 1 en
van schaakbord 2. Afwerking en schaakbord rekent FEM Studio met 1 kN/m²; de combinaties
zijn sommen daarvan, zodat een andere last niet opnieuw gerekend hoeft te worden:

- UGT bij volle belasting en bij elk schaakbord, met de factoren van de gevolgklasse uit
  de projectgegevens (6.10a, opslag ψ0 = 1,0);
- frequent, G + ψ1·Q met ψ1 = 0,9 (opslag), bij volle belasting en bij elk schaakbord,
  voor de scheurwijdte;
- karakteristiek, voor de doorbuiging.

## Wat het blad toont

**Krachtsverdeling.** Op papier m_x en m_y bij volle belasting als kleurvlak naast
elkaar, met de punten van de wapeningsberekening erin. Op het scherm een 3D-beeld van
m_x, m_y, m_xy of de doorbuiging, bij de combinatie naar keuze (UGT vol, UGT schaakbord 1
of 2, frequent); de uitersten per geval en combinatie staan in het `@fem`-blok.

**Wapening per punt, met het drielagenmodel** (`solve_native_fem`, `threeLayer`). Per
punt gaan m_x, m_y en m_xy uit het FEM-model erin; eruit komt de benodigde wapening per
richting onder en boven, met de toets van het beton in de buitenlagen, tegen de aanwezige
wapening (de netten, de bijleg boven waar die ligt, de bijleg onder in een strook). De
punten, in de richting met de grootste paalafstand:

1. binnenveld, midden;
2. binnenveld op de paallijn (de kolomstrook in het veld; in de strook als die er is);
3. binnenpaal, naast de paalkop (in de ponskop of de strook als die er is);
4. randveld, midden;
5. randveld op de paallijn;
6. randstrook langs de vrije rand;
7. hoekveld, midden;
8. hoekveld op de diagonaal bij de eerste binnenpaal: hier is het wringend moment groot;
9. randpaal, naast de paalkop;
10. naast de ponskop of de dwarse strook bij de binnenpaal, in de dunnere plaat (alleen
    als er een verdikking is).

De buitenlagen liggen om het hart van de twee staaflagen van een net: 2·a dik, met a de
afstand van dat hart tot het vlak, en de arm z = t − a_onder − a_boven. Per buitenlaag
volgt de wapening uit NEN-EN 1992-1-1 bijlage F; het beton tegen f_cd (ongescheurd) of
0,6·ν′·f_cd (gescheurd), met ν′ = 1 − f_ck/250. Per punt drie UGT-combinaties (vol en
beide schaakborden); de tabel geeft de momenten van de maatgevende en de grootste
benodigde wapening. In een strook telt het net mee naar zijn arm. Punt 10 ligt op de rand
van een verdikking, waar FEM Studio de momenten per plaat van één kant middelt: daar telt
de grootste van de waarde op de rand en de waarde die vanuit de dunnere plaat (op 1, 2 en
3 mazen) naar de rand is doorgetrokken. Op het scherm is één punt naar keuze volledig
uitgeschreven, met de controle met de hand ernaast. Het drielagenmodel is een deeltoets:
dwarskracht en pons, verankering en detaillering horen er niet bij.

**Scheurwijdte door belasting** (`solve_native_fem`, `crackWidth`, NEN-EN 1992-1-1
7.3.4). Per punt en per laag (onder x, onder y, boven x, boven y), onder de **frequente**
combinatie: de Nederlandse nationale bijlage toetst de scheurwijdte van gewapend beton
daaronder (bij 7.3.1(5), tabel 7.1N), niet onder de quasi-blijvende. De staalspanning
komt uit het drielagenmodel (de kracht in de buitenlaag gedeeld door de wapening, dus
met m_xy), de drukzone uit de lineair-elastische gescheurde doorsnede met α_e = E_s/E_cm.
Invoer: de toelaatbare scheurwijdte w_max (0,4 mm in X0 en XC1, 0,3 mm in XC2 tot en met
XC4, 0,2 mm in XD en XS) en de belastingsduur (k_t = 0,4 langdurend of 0,6 kortdurend);
k_1 = 0,8, k_2 = 0,5, f_ct,eff = f_ctm. Gerekend is alsof de doorsnede gescheurd is, ook
waar het moment onder het scheurmoment blijft: krimp kan de eerste scheur maken. Een laag
zonder trek wordt overgeslagen. De tabel geeft per punt de laag met de grootste
scheurwijdte.

**Momenten per zone** (op het scherm, en als tweede toets in de samenvatting): het
gemiddelde moment over de zones van NEN-EN 1992-1-1 bijlage I, met z = 0,9·d en zonder
m_xy. Dit was de toets van de vorige versie van het blad; de lengte van de bijleg volgt
eruit.

**Verder:** de bijleg boven (zo lang als de kolomstrook meer vraagt dan het net boven,
plus d en de verankeringslengte), de complete wapening rond een binnenpaal in 3D, de
paalreacties voor de module Pons (`#1.R_binnen`, `R_rand`, `R_hoek`, `R_paal`), het piekmoment boven de
binnenpaal begrensd op een vijfde van de paalreactie (m ≤ R/5 per meter) en getoetst met het
net boven en de bijleg, en krimp:
de vrije krimp volgens NEN-EN 1992-1-1 bijlage B en ACI 209R-92 en de verkorting over de
vloer. Standaard krimpt de vloer vrij: een vloer op palen ligt op grond die te slap is om op
te funderen, de palen buigen mee en houden de vloer niet vast, dus er ontstaat geen trek en
geen krimpscheur. Met de keuze *verhinderd* (een vloer die aan wanden, poeren of een
bestaande vloer vastzit) komen de minimumwapening (7.1) en een geschatte scheurwijdte met de
verhinderingsgraad (NEN-EN 1992-3 bijlage M) erbij.

**Zonder FEM Studio:** de blokken staan als NIET GEREKEND en het blad meldt dat de
krachtsverdeling, de wapening, de scheurwijdte en de paalreacties nog niet gerekend zijn,
met het eindoordeel "niet getoetst". Er is geen terugval op een andere rekenkern. Het
drielagenmodel rekent pas als het FEM-model er is, de scheurwijdte pas als het
drielagenmodel er is.

**Op papier** ongeveer drie pagina's: de invoer, het rekenmodel in het kort, de twee
kleurvlakken, de tabel per punt, de tabel met de scheurwijdte, de bijleg, de paalreacties,
de krimp en de samenvatting. Het model van het `@fem`-blok, het 3D-beeld, de uitersten
per combinatie, het uitgeschreven punt en de zones staan alleen op het scherm.

## Nagerekend

Standaardinvoer (4 × 4 velden van 3,6 m, h = 250 mm, C30/37, q = 20 kN/m², netten
Ø12-150 onder en Ø10-150 boven, bijleg Ø12-150), met de antwoorden van Open FEM Studio
2026.44.2:

| Punt | m_x, m_y, m_xy [kNm/m] | A_s nodig / aanwezig [mm²/m] | UC staal | laag | σ_s [N/mm²] | w_k [mm] | UC |
|---|---|---|---|---|---|---|---|
| 1 binnenveld midden | 17,7 · 17,7 · 0,1 | onder 242 / 754 | 0,32 | onder y | 88 | 0,082 | 0,27 |
| 2 binnenveld paallijn | 24,8 · −11,2 · 0 | onder x 340 / 754, boven y 154 / 524 | 0,45 | onder x | 124 | 0,108 | 0,36 |
| 3 binnenpaal naast kop | −67,7 · −78,9 · 0 | boven 927 en 1080 / 1278 | 0,84 | boven y | 232 | 0,193 | 0,64 |
| 4 randveld midden | 38,0 · 17,3 · −0,2 | onder 522 en 389 / 754 | 0,69 | onder x | 190 | 0,167 | 0,56 |
| 5 randveld paallijn | 46,7 · −4,1 · 0 | onder x 639 / 754 | 0,85 | onder x | 233 | 0,204 | 0,68 |
| 6 randstrook vrije rand | 50,4 · 3,6 · 3,6 | onder x 738 / 754 | 0,98 | onder x | 268 | 0,234 | 0,78 |
| 7 hoekveld midden | 36,6 · 36,6 · −2,4 | onder 534 / 754 | 0,71 | onder y | 195 | 0,183 | 0,61 |
| 8 hoekveld diagonaal | −18,5 · −18,5 · 12,8 | boven 428 / 1278, onder 53 / 754 | 0,33 | boven y | 92 | 0,065 | 0,22 |
| 9 randpaal naast kop | −1,9 · −48,6 · 0 | boven y 665 / 1278 | 0,52 | boven y | 143 | 0,101 | 0,34 |

Het beton in de buitenlagen komt hoogstens op 0,33. Maatgevend is punt 6, de randstrook
langs de vrije rand in het hoekveld: de zones van de vorige versie gaven daar 0,77.

- **Het drielagenmodel met de hand, zuiver m_x** (punt 2: m_y drukt onder, m_xy = 0):
  z = 250 − 42 − 40 = 168 mm, A_s = m/(z·f_yd) = 24,84·10⁶/(168 · 434,8) = 340,1 mm²/m;
  FEM Studio geeft 340,1. De oude aanpak z = 0,9·d met d = 202 mm (z = 181,8 mm) geeft
  314,3 mm²/m: het drielagenmodel vraagt 8,2 % meer, omdat de arm tussen de twee netten
  kleiner is dan 0,9·d.
- **De scheurwijdte met de hand** (punt 6, onder x, Ø12-150, c = 30 mm, d = 214 mm):
  σ_s = 268,0 N/mm², x = 39,98 mm, h_c,ef = min(2,5·36; (250 − 39,98)/3; 125) = 70,0 mm,
  ρ_p,eff = 754/(1000 · 70,0) = 0,01077, α_e = 200 000/32 837 = 6,09;
  ε_sm − ε_cm = max((268,0 − 0,4 · 2,896/0,01077 · (1 + 6,09 · 0,01077))/200 000;
  0,6 · 268,0/200 000) = max(0,767; 0,804) ‰ = 0,804 ‰; s_r,max = 3,4 · 30 +
  0,8 · 0,5 · 0,425 · 12/0,01077 = 291,4 mm (onder de bovengrens van de nationale bijlage,
  (50 − 0,8 · 30) · 12 = 312 mm); w_k = 291,4 · 0,804·10⁻³ = 0,234 mm, tegen 0,30 mm
  UC = 0,78. FEM Studio geeft 0,2343 mm.
- **Wat m_xy doet in het hoekveld.** In het midden van het hoekveld (punt 7) weinig:
  534 mm²/m met m_xy, 501 zonder (+7 %). Op de diagonaal bij de eerste binnenpaal
  (punt 8) veel: bij volle belasting boven 428 mm²/m per richting, tegen 253 zonder m_xy
  (+69 %); bij schaakbord 2 (m = −13,6, m_xy = 17,5 kNm/m) boven 426 tegen 187 (+128 %),
  en onder 53 mm²/m waar zonder m_xy niets nodig was. In de randstrook (punt 6, het
  maatgevende punt) 738 tegen 690 mm²/m (+7 %).
- **Het blad rekent het zelf na.** Op het scherm staat voor het uitgeschreven punt de
  wapening volgens bijlage F met de hand en de scheurwijdte volgens (7.8) tot en met
  (7.11) met de hand, gedeeld door de uitkomst van FEM Studio (`ctl_3`, `ctl_w`): 1,000
  in alle varianten en in de punten 2, 3 en 8 van de standaardinvoer.
- Evenwicht: per belastinggeval Σ R = Σ last (in het `@fem`-blok; op papier voor de
  afwerking).
- Statica van het binnenveld: veldmoment min het gemiddelde steunmoment, over de hele
  vloerbreedte, gedeeld door w·l_n²/8 met de doorsneden één maas buiten de paalkop of
  verdikking: 0,99 (vlak), 0,98 (ponskop), 1,00 (stroken); over één veldbreedte
  1,00 tot 1,04.
- Het vorige rekenmodel van deze module (eigen plaatkern, 8 elementen per veld), met de
  buitenste paalrij op de rand en dezelfde definities: veld 26,3 → 27,8, kolomstrook
  44,4 → 57,0, piek 60,8 → 88,9 kNm/m, paalreactie 570 → 562 kN.

De minimumwapening bij krimp (7.1) voldoet met de standaardinvoer niet (UC 2,02); dat was
al zo, en het blad geeft daarom "voldoet niet" tot de netten zwaarder zijn of de vloer
voegen krijgt.

## Testgegevens

`test/varianten.json` beschrijft de varianten met hun verwachte uitkomsten: vlak,
ponskop, stroken, alles, rechthoekig en de vergelijking met het vorige model; de
standaardinvoer met punt 2, 3 en 8 uitgeschreven (de controle met de hand); en `fnl`, die
juist niets mag geven. `test/<naam>.json.gz` zijn de antwoorden van Open FEM Studio: per
variant vier belastinggevallen van het `@fem`-blok, de reeks van het drielagenmodel (54 of
60 aanroepen) en de reeks van de scheurwijdte. `node scripts/controleer.mjs --app <pad>`
rekent ze zonder FEM Studio na; `node scripts/fem-antwoorden.mjs --app <pad>` maakt ze
opnieuw.

## Buiten het blad

Puntlasten (wielen, stellingpoten), vermoeiing, temperatuur, de pons zelf (module Pons),
de paal en zijn draagvermogen, de voegen, krachten in het vlak van de vloer (de
scheurwijdte door krimp staat apart, niet opgeteld bij die door belasting), en gescheurd
gedrag in de krachtsverdeling: FEM Studio rekent een plaat nu alleen lineair.

**Status: concept.** Nog niet op een referentieberekening nagerekend.
