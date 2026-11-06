# Bedrijfsvloer op grondslag (puntlasten)

*Industrial ground-bearing floor under point loads: Westergaard moments with the
modulus of subgrade reaction, then steel fibre concrete and a reinforcing mesh
side by side.*

Een betonvloer op een verende ondergrond (Winkler) onder drie geconcentreerde
lasten: een heftruckwiel, de oplegging van een haspel op de vloer en een
stellingpoot. Het blad laat zien welke last maatgevend is en wat de vloer
daarvoor nodig heeft: staalvezels of een wapeningsnet.

**Ondergrond:** de beddingsconstante k zoals CUR-Aanbeveling 36 die gebruikt,
uit grondonderzoek of een plaatbelastingproef. De straal van de relatieve
stijfheid is l = (E·h³/(12(1 − ν²)·k))^¼.

**Belastingen:** per last de karakteristieke waarde en het contactvlak. Het
wiel krijgt de dynamische factor uit NEN-EN 1991-1-1 6.3.2.3 (1,40 luchtbanden,
2,00 massieve banden); γ_Q volgt de gevolgklasse uit de projectgegevens. De
lasten staan overal, alleen niet in hoeken, of alleen midden in het veld; bij
een voeg kan een deel van de last naar het buurveld gaan (β_v).

**Momenten (elastisch):** Westergaard voor een last midden in het veld (met
de gelijkwaardige straal b), de formule van 1948 voor de rand en die van
Ioannides voor de hoek. Een tekening toont de vloer op veren met de
doorbuigingskom en de gronddruk onder het wiel (w_max = F/(8·√(k·D))).

**Uitvoering:** wapeningsnet, staalvezelbeton of beide naast elkaar; het blad toont alleen de gekozen toetsen.

**Toetsen:**

- ongewapend en ongescheurd: het grootste moment tegen het scheurmoment met
  f_ctd,fl uit NEN-EN 1992-1-1 (3.23)
- staalvezelbeton per doorsnede: reststerkte f_R,3,k (NEN-EN 14651),
  star-plastisch f_Ftu = f_R3/3 (fib Model Code 2010), γ_F = 1,5
- staalvezelbeton met herverdeling: breuklijnen volgens Meyerhof, zoals TR34
  (Concrete Society), met M_p uit de vezels en M_n het scheurmoment; twee
  wielen of poten binnen 2·l samen. Het blad geeft ook de f_R,3,k die nodig is
  midden in het veld en langs randen
- wapeningsnet boven en onder: benodigde wapening per meter M_Ed/(f_yd·0,9d)
  tegen het gekozen net
- contactdruk onder elk contactvlak en pons (NEN-EN 1992-1-1 6.4, d = 0,75h,
  zonder aftrek van de gronddruk)

**Buiten het blad:** vermoeiing door veel heftruckritten, krimp en
temperatuur, scheurwijdte, zettingen en het ontwerp van de voegen. Het tweede
wiel telt alleen mee in de toets met herverdeling.

**Status: concept.** De uitkomsten met de standaardinvoer kloppen met een
handberekening (h = 200 mm, C30/37, k = 0,05 N/mm³, wiel 105 kN op 200 × 250
mm: l = 822 mm; midden 25,4, rand 47,4 en hoek 31,9 kNm/m). Nog niet nagerekend
op een referentieberekening.
