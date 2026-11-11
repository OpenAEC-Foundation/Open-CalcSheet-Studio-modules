# Bedrijfsvloer op palen (FEM, ponskop, stroken, krimp)

*Pile-supported industrial floor: Open FEM Studio calculates a floor patch including its
edge, as a flat slab, with drop panels, with thickened strips, or a combination. Per zone
the sheet gives the reinforcement at the actual thickness, with the complete
reinforcement around a pile in 3D, the pile reactions for punching, and shrinkage.*

Een betonvloer op palen in een regelmatig raster. Open FEM Studio rekent een stuk vloer
met de vloerrand als plaatmodel; het blad maakt het model, leest de momenten per zone en
geeft de wapening, de paalreacties en wat krimp betekent voor een lange vloer zonder voeg.
Vraagt een app met het `@fem`-blok (2026.46.0) en Open FEM Studio.

**Model:** een vloer van n × n velden (3 tot 5, standaard 4) met de vloerrand rondom:
hoekvelden, randvelden en binnenvelden; de buitenste paalrij ligt a_r binnen de rand
(standaard 0,3 m). Te combineren:

- een vlakke plaat;
- een ponskop boven elke paal (vierkant, breedte b_k, dikte t_k);
- versterkte stroken over de paalrijen in x, in y of beide (breedte b_s, dikte t_s).

De bovenkant is vlak; platen van verschillende dikte liggen tegen elkaar en delen hun
knopen. Vierhoekige elementen (MITC4) met een maas van L/12, grover als het raster
anders meer dan 8000 knopen krijgt (het blad waarschuwt boven L/8). Een paal is een veer
k, verdeeld over de knopen binnen de paalkop.

**Belastingen:** vier belastinggevallen: eigen gewicht (25 kN/m³ maal de dikte ter
plaatse, dus met koppen en stroken), afwerking, en het veranderlijke deel op de velden
van schaakbord 1 en van schaakbord 2. Afwerking en schaakbord rekent FEM Studio met
1 kN/m²; de combinaties vermenigvuldigen dat met g_afw en q_k, zodat een andere last niet
opnieuw gerekend hoeft te worden. Combinaties: UGT bij volle belasting en bij elk
schaakbord, met de factoren van de gevolgklasse uit de projectgegevens (6.10a, opslag
ψ0 = 1,0), en de karakteristieke combinatie voor de doorbuiging.

**Zones:** per zone het gemiddelde moment over de zone (`fem_strook`), de omhullende
over de drie UGT-combinaties, in x en in y; de kolomstrook is een half veld breed op de
paallijn (NEN-EN 1992-1-1 bijlage I).

- trek onder: binnenveld (middenstrook en kolomstrook), randveld (op 0,3, 0,4 en 0,5·L
  van de buitenste paalrij), hoekveld en randstrook langs de vrije rand, en de strook;
- trek boven: middenstrook op de paallijn, kolomstrook boven de binnenpaal en boven de
  randpalen (op de paal-as en aan de rand van de verdikking), de ponskop en de strook
  bij de paal; de piek op de paal ter informatie.

Elke zone toetst m_Ed tegen m_Rd = A_s·f_yd·0,9·d, met d van de binnenste laag bij de
werkelijke dikte: het net onder in het veld, net onder plus de bijleg onder in de strook
(die ligt onder in de strook), het net boven in de middenstrook, en net boven plus de
bijleg boven in de kolomstrook, de kop en de strook. Aan de rand van een verdikking
middelt FEM Studio de momenten op een knoop per plaat, dus van één kant; daar telt ook
de waarde die vanuit de dunne vloer (op 1, 2 en 3 mazen) naar de rand is doorgetrokken.

**Bijleg boven:** zo lang als de kolomstrook meer vraagt dan het net boven, plus d en
de verankeringslengte (8.4.3, matige hechting), in beide richtingen over de kolomstrook.

**Pons:** de grootste paalreactie van een binnen-, rand- en hoekpaal (R_binnen, R_rand,
R_hoek, R_paal) en de plaatdikte bij de paal. Voeg de module Pons toe en verwijs in V_Ed
naar dit blad (`#1.R_binnen`).

**Beelden:** een plattegrond met de ponskoppen, de stroken en de zones (op het scherm);
het rekenmodel met de dikten (in het `@fem`-blok); m_x in kleur; m_x in 3D (op het
scherm); en de complete wapening rond een binnenpaal in 3D, een veld groot, met de beton
als omtrek: de netten onder en boven, de bijleg boven, de stoelen (lintstoelen om de
meter, hoogte uit de netten), de bijleg onder in de stroken, een net onder in de
ponskop, en de ponswapening (deuvelrails in acht richtingen) als die gekozen is. Hoeveel
ponswapening nodig is, rekent de module Pons.

**Krimp:** de vrije krimp volgens NEN-EN 1992-1-1 bijlage B en volgens ACI 209R-92 met
het cementgehalte, de verkorting over de vloerlengte, de minimumwapening bij een
opgelegde vervorming (7.1) en een geschatte scheurwijdte met de verhinderingsgraad
(NEN-EN 1992-3 bijlage M).

**Zonder FEM Studio:** het `@fem`-blok staat als NIET GEREKEND en het blad meldt dat
momenten, wapening en paalreacties nog niet gerekend zijn. Er is geen terugval op een
andere rekenkern.

**Nagerekend** (standaardinvoer, maas L/12, de antwoorden van Open FEM Studio 2026.44.2):

- evenwicht: per belastinggeval Σ R = Σ last (in het blok);
- statica van het binnenveld: veldmoment min het gemiddelde steunmoment, over de hele
  vloerbreedte, gedeeld door w·l_n²/8 met de doorsneden één maas buiten de paalkop of
  verdikking: 0,99 (vlak), 0,98 (ponskop), 1,00 (stroken); over één veldbreedte
  1,00 tot 1,04. Op de rand van de paalkop zelf komt het lager uit (0,93 bij L/12, 0,96
  bij L/16): daar middelt FEM Studio een steil verloop;
- het vorige rekenmodel van deze module (eigen plaatkern, 8 elementen per veld), met de
  buitenste paalrij op de rand en dezelfde definities: veld 26,3 → 27,8, kolomstrook
  44,4 → 57,0, piek 60,8 → 88,9 kNm/m, paalreactie 570 → 562 kN. Met 16 elementen per
  veld geeft de oude kern zelf 27,9, 58,1, 96,7 en 572: 8 elementen per veld konden de
  paalkop van 400 mm niet volgen. Het nieuwe raster loopt door de rand van elke paalkop;
- de rand: het randveld en het hoekveld vragen 45 tot 46 kNm/m onder, tegen 18 tot 23 in
  het binnenveld; het vorige blad nam alleen de binnenvelden mee;
- een ponskop (1000 × 400) verhoogt het steunmoment over de breedte van de kop van 72 naar
  107 kNm/m en verlaagt het veld (binnenveld 17,8 → 14,4 en 22,7 → 16,5 kNm/m); stroken
  (800 × 350 in x en y) verlagen het veld naar 13,2 en 13,3 kNm/m en het randveld van 45
  naar 31 kNm/m, en dragen zelf 86 kNm/m.

**Testgegevens:** `test/varianten.json` beschrijft zes varianten (vlak, ponskop, stroken,
alles, rechthoekig en de vergelijking met het vorige model) met hun verwachte uitkomsten;
`test/<naam>.json.gz` zijn de antwoorden van Open FEM Studio. `node scripts/controleer.mjs
--app <pad>` rekent ze zonder FEM Studio na; `node scripts/fem-antwoorden.mjs --app <pad>`
maakt ze opnieuw.

**Buiten het blad:** puntlasten (wielen, stellingpoten), vermoeiing, temperatuur, de
pons zelf (module Pons), de paal en zijn draagvermogen, de voegen, en gescheurd gedrag:
FEM Studio rekent een plaat nu alleen lineair.

**Status: concept.** Nog niet op een referentieberekening nagerekend.
