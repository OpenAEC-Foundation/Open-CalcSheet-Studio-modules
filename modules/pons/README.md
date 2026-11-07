# Pons (plaat op kolom of paal)

*Punching shear around a concentrated support of a slab: a column, or a pile
under a floor, to NEN-EN 1992-1-1 6.4.*

Toetsing van pons rond een geconcentreerde oplegging van een plaat volgens
NEN-EN 1992-1-1, 6.4. Het steunvlak is rond (een paal of ronde kolom) of
rechthoekig, en ligt binnen in de plaat, aan een vrije rand of in een hoek.

**Invoer:** plaatdikte, dekking, betonklasse, de trekwapening boven de
oplegging in x en y (Ø en h.o.h.), het steunvlak, de ligging, de oplegreactie
V_Ed en eventueel de last op de plaat binnen u1 (die mag binnen in de plaat van
V_Ed af).

**Toetsen:**

- bij het steunvlak, u0: v_Ed tegen v_Rd,max = 0,4·ν·f_cd (6.4.5(3)); aan een
  rand en in een hoek de u0 van 6.4.5(3)
- op de basiscontroleomtrek u1 op 2d: v_Ed tegen v_Rd,c (6.47) met v_min
  (6.3N); β volgens figuur 6.21N (1,15, 1,4 of 1,5)
- bij een tekort de ponswapening volgens (6.52): A_sw per omtrek, het aantal
  staven per omtrek (ook om de 1,5·d, 9.4.3), de minimumwapening per staaf
  (9.11), u_out (6.54) en het aantal omtrekken, de eerste op 0,5·d en om de
  0,75·d tot 1,5·d binnen u_out

**Omtrekken:** het steunvlak is een afgeronde rechthoek (een rond steunvlak heeft
alleen een straal); een omtrek op afstand e houdt dezelfde rechte stukken en een
straal plus e. Aan een rand ligt de vrije rand langs de buitenkant van het
steunvlak, in een hoek langs twee kanten; voor een rechthoekig steunvlak geeft
dat c2 + 2c1 + 2πd en c1 + c2 + πd, zoals figuur 6.15. Een rond steunvlak aan een
rand of in een hoek heeft voor u0 de maat van een vierkant met zijde D.

**Beelden:** een plattegrond met u0, u1 en zo nodig de omtrekken met
ponswapening en u_out; een doorsnede met h, d, 2d, de kegel van 26,6° en de
staven; een 3D-beeld van het stuk plaat met de paal of kolom, de kegel, u1 en de
staven.

**Buiten het blad:** momenten in de oplegging (dan een berekende β), een
normaalspanning in de plaat (σ_cp = 0), sparingen bij de oplegging en
overlappende omtrekken van dicht bij elkaar staande palen.

**Status: concept.** Nagerekend met handberekeningen voor binnen, rand en hoek,
rond en rechthoekig; nog niet op een referentieberekening.
