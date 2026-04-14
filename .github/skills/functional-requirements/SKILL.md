---
name: functional-requirements
description: >
  Naudok šį skilį kuriant, analizuojant ar formatuojant programinės sistemos funkcinių reikalavimų dokumentus Markdown lentelės formatu.
  Trigeriuok visada kai vartotojas mini: funkcinius reikalavimus, reikalavimų specifikaciją, sistemos reikalavimus, use case aprašymus,
  reikalavimų lentelę, FR dokumentą, reikalavimų sąrašą arba prašo struktūrizuoti/aprašyti sistemos funkcionalumą.
  Naudok taip pat kai vartotojas įkelia PDF/Word dokumentą su reikalavimais ir prašo jį sustruktūrizuoti.
---

# Funkcinių Reikalavimų Aprašymo Skilis

Šis skilis padeda AI agentui sukurti funkcinių reikalavimų lentelę Markdown formatu pagal pateiktą aprašymą, dokumentą ar kontekstą.

---

## Išvesties formatas

Reikalavimų lentelė sudaroma pagal šį šabloną:

```markdown
# Funkciniai reikalavimai

## [Modulio / Srities pavadinimas]

| Eil. Nr. | Reikalavimo grupė | Aprašymas |
|----------|-------------------|-----------|
| 1. | [Grupės pavadinimas] | [Detalus reikalavimo aprašymas] |
| 1.1 | | a. [Konkretus žingsnis ar sąlyga] |
| 1.2 | | b. [Kitas žingsnis ar sąlyga] |
```

---

## Struktūros taisyklės

### 1. Eilučių numeracija
- Pagrindiniai reikalavimai numeruojami sveikaisiais skaičiais: `1.`, `2.`, `3.` ...
- Antriniai reikalavimai (sub-reikalavimai) numeruojami su tašku: `1.1`, `1.2`, `2.1` ...
- Jei yra dar gilesnis lygis, naudojama raidė: `a.`, `b.`, `c.` arba `i.`, `ii.`, `iii.`

### 2. Reikalavimo grupė
- Stulpelyje „Reikalavimo grupė" nurodomas trumpas funkcinis blokas arba procesas (pvz., „Paraiškos registravimas", „Naudotojų administravimas").
- Grupė rašoma tik prie pirmojo grupės įrašo. Sekančios eilutės toje pačioje grupėje palieka stulpelį tuščią.

### 3. Aprašymas
- Turi būti konkretus, vienareikšmis, tikrinamas.
- Kiekvienas reikalavimas aprašo **vieną** funkciją ar elgseną.
- Naudojamas veiksmažodinis stilius: „Sukurti...", „Realizuoti...", „Tikrinti...", „Atnaujinti...".
- Nurodomi konkretūs laukų pavadinimai, simbolių limitai, sistemos komponentai jei žinomi.
- Jei reikalavimas turi sąlygas – jos aprašomos atskirose sub-eilutėse su `a.`, `b.` žymėjimu.

---

## Turinio analizės algoritmas

Prieš kuriant lentelę, atlik šiuos žingsnius:

### Žingsnis 1 – Identifikuok modulius
Suskirstyk visus reikalavimus į logines grupes / modulius. Pavyzdžiai:
- Paraiškos registravimas
- Naudotojų administravimas
- Sutarties administravimas
- Dalyvių duomenų valdymas
- Mokėjimai ir grąžintinos lėšos
- Ataskaitų generavimas
- Bendri sistemos reikalavimai

### Žingsnis 2 – Išgauk reikalavimus
Kiekvienam moduliui surask:
- Pagrindinį funkcinį veiksmą (kas turi būti padaryta)
- Sąlygas ir išimtis (kada, kaip, kodėl)
- Integracijas su kitomis sistemomis (pvz., SODRA, DMS, SFMIS)
- Validacijas ir kontroles (kritinės klaidos, perspėjimai)
- UI/UX detales (mygtukai, laukai, formatai)

### Žingsnis 3 – Suformuok lentelę
- Kiekvienam moduliui – atskira lentelė su antrašte `## [Modulio pavadinimas]`
- Reikalavimai rikiuojami nuo bendresnių iki specifinių
- Susijusios sąlygos grupuojamos po pagrindiniu reikalavimu

---

## Konvencijos ir žymėjimai

| Žymėjimas | Reikšmė |
|-----------|---------|
| **[PRIVALOMA]** | Laukas arba funkcija privaloma |
| **[NEPRIVALOMA]** | Laukas arba funkcija neprivaloma |
| **[KRITINĖ KLAIDA]** | Sistemos klaida, neleidžianti tęsti |
| **[NEKRITINĖ KLAIDA]** | Perspėjimas, leidžiantis tęsti |
| **[AUTOMATINIS]** | Laukas pildomas automatiškai be vartotojo įsikišimo |
| **[REDAGUOJAMAS]** | Automatiškai užpildytas laukas gali būti keičiamas |
| `YYYY-MM-DD` | Datos formato kontrolė |
| `X@X.XX` | El. pašto formato kontrolė |

---

## Pilnas pavyzdys

Žemiau pateikiamas pavyzdinės lentelės fragmentas, sukurtas pagal dokumento struktūrą:

```markdown
# Funkciniai reikalavimai

## 1. Paraiškos registravimo procesas – Paraiškos forma

| Eil. Nr. | Reikalavimo grupė | Aprašymas |
|----------|-------------------|-----------|
| 1. | Paraiškos formos atnaujinimas | Atnaujinti off-line ir SFMIS2014 paraiškos formas (įskaitant DMS ir spausdinamas) pagal galiojančią paraiškos formą. |
| 1.1 | | a. Padidinti paraiškos 6 dalies lauko „Projekto tikslas" simbolių skaičių iki 700 (šiuo metu – 300). |
| 1.2 | | b. Sukurti kontrolę tarp paraiškos 10 dalies ir 11 dalies 3.1 eilutės: jei pažymėti punktai 10.1, 10.3 arba 10.4, negalima nurodyti pajamų sumos 11 dalies 3.1 eilutėje. **[KRITINĖ KLAIDA]** |
| 1.3 | | c. Padidinti 15 p. lentelės lauko „Aprašymas" simbolių skaičių iki 1000 (šiuo metu – 300). |
| 1.4 | | d. Partnerio deklaracijos lape sukurti lauką „Projekto pavadinimas". Laukas užpildomas **[AUTOMATINIS]**, jei projekto pavadinimas nurodytas paraiškoje. **[REDAGUOJAMAS]** |
| 2. | Formos taikymo apimtis | Reikalavimai taikomi paraiškos formoms: subsidijų priemonių projektams, visuotinės dotacijos projektams ir JP projektams. |

## 2. DMS naudotojų administravimas

| Eil. Nr. | Reikalavimo grupė | Aprašymas |
|----------|-------------------|-----------|
| 1. | Automatinis naudotojo sukūrimas | DMS teikiant paraišką, formoje „DMS naudotojai" **[AUTOMATINIS]** turi susikurti DMS naudotojas su vadovo teisių rinkiniu. |
| 1.1 | | a. Vadovo teisių rinkinys papildomas paraiškos administravimo teise (viso projekto teisės nuo paraiškos iki sutarties). |
| 1.2 | | b. Jei paraiška pateikta raštu – ĮI turi galimybę sukurti DMS naudotojus pagal gautą DMS taisyklių priedą. |
| 1.3 | | c. DMS turi galimybę redaguoti / blokuoti SFMIS2014 priemonėmis sukurtus naudotojus. |
| 1.4 | | d. Blokuojant naudotoją tikrinama, ar jis nėra vienintelis turėtojas kurios nors teisės – tokio naudotojo **[KRITINĖ KLAIDA]** blokuoti neleidžiama. |
| 1.5 | | e. DMS naudotojų sąraše pažymima, kai naudotojas yra užblokuotas. |
```

---

## Dažnos klaidos ir kaip jų išvengti

| Klaida | Kaip išvengti |
|--------|--------------|
| Vienas reikalavimas aprašo kelias funkcijas | Skaidyk į atskiras eilutes |
| Neaiški sąlyga („jei reikia", „tam tikrais atvejais") | Tiksliai suformuluok sąlygą arba pažymėk detaliai analizei |
| Trūksta sistemos komponentų nuorodos | Visada nurodyk sistemą (DMS, SFMIS2014, SODRA ir pan.) |
| Pasyvus stilius („turi būti atlikta") | Naudok veiksmažodinį stilių su subjektu („Sistema tikrina...", „Vartotojas gali...") |
| Sumaišyti funkciniai ir nefunkciniai reikalavimai | Nefunkciniams reikalavimams (greitis, saugumas) kuri atskirą skyrių |

---

## Papildomi skyriai (jei reikalinga)

Jei dokumentas apima daugiau nei funkcinius reikalavimus, pridėk atskirus skyrius:

```markdown
## Duomenų tvarkymas (Data Corrections)
<!-- Konkretūs duomenų korekcijų reikalavimai su projekto kodais -->

## Integracijos reikalavimai
<!-- Sąsajos su išorinėmis sistemomis: SODRA, VIISP ir kt. -->

## Nefunkciniai reikalavimai
<!-- Veikimas, saugumas, prieinamumas -->
```

---

## Žingsniai vykdant užduotį

1. **Perskaityti** visą pateiktą dokumentą ar aprašymą
2. **Identifikuoti** modulius ir reikalavimų grupes
3. **Sudaryti** lentelę pagal aukščiau aprašytą formatą
4. **Patikrinti**: ar kiekvienas reikalavimas yra konkretus, tikrinamas ir vienareikšmis?
5. **Pateikti** Markdown formatą, kurį galima tiesiogiai naudoti dokumentacijoje
