# Bedrijfsvloer op palen (FEM, schaakbord, krimp)

*Pile-supported industrial floor: a 4 × 4 bay patch on elastic piles computed with
plate elements for full and pattern loading, reinforcement, the pile reaction for
punching, and shrinkage with the cement content.*

Een betonvloer op palen in een regelmatig raster. Het blad rekent een stuk vloer
van 4 × 4 velden met plaatelementen en geeft de wapening, de paalreactie en wat
krimp betekent voor een lange vloer zonder voeg.

**Model:** een vlakke plaat op verende palen (de functie `plaat_palen` van de app,
driehoekige DKT-elementen, 8 per veldzijde). Een paal is een veer, verdeeld over de
paalkop. De rand van het rekenmodel is vrij; voor de momenten tellen alleen de
binnenste velden, de grootste paalreactie komt uit alle palen.

**Belastingen:** eigen gewicht en afwerking als permanente last, een veranderlijke
last (opslag, categorie E, ψ0 = 1,0, dus 6.10a maatgevend), met de factoren van de
gevolgklasse uit de projectgegevens. Twee belastinggevallen: alle velden vol, en
schaakbord (permanent overal, veranderlijk om en om).

**Toetsen:**

- wapening onder uit het grootste veldmoment en boven uit het steunmoment
  gemiddeld over de kolomstrook (L/4 aan weerszijden van de paal, NEN-EN 1992-1-1
  bijlage I), met een net boven en bijlegwapening boven de palen; z = 0,9·d
- de grootste paalreactie R_paal als oplegreactie voor de pons: voeg de module
  Pons toe en verwijs in V_Ed naar dit blad (`#1.R_paal`)
- krimp: de vrije krimp volgens NEN-EN 1992-1-1 bijlage B (cementsoort S, N of R)
  en volgens ACI 209R-92 met het cementgehalte (factor 0,75 + 0,00061·c), de vrije
  verkorting over de vloerlengte, de minimumwapening bij een opgelegde vervorming
  (7.1) en een geschatte scheurwijdte met de verhinderingsgraad (NEN-EN 1992-3
  bijlage M, s_r,max uit (7.11))

**Beelden:** een plattegrond van het rekenmodel met de palen, het schaakbord en
de kolomstrook; m_x in kleur bij volle belasting; de doorbuiging bij schaakbord in
3D met de palen.

**Buiten het blad:** puntlasten (wielen, stellingpoten), vermoeiing,
temperatuur, de pons zelf (module Pons), de paal en zijn draagvermogen, en de
voegen.

**Status: concept.** De plaatrekenkern is in de app nagerekend op Navier, evenwicht
en een binnenveld van een vlakke plaatvloer; de statica van een binnenveld (veld- plus
steunmoment over de breedte) klopt met q·L·l_n²/8. Nog niet op een
referentieberekening nagerekend. Vraagt een app met `plaat_palen`.
