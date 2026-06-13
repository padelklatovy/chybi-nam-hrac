# Chybí nám hráč · Padel Klatovy

Minimalistický nástroj pro komunitu: vytvoř otevřenou hru, pošli profesionální
pozvánku do WhatsApp skupiny a měj přehled aktivních her s jednoduchým stavem
obsazenosti.

Není to sociální síť — žádný chat, lajky, komentáře ani profily. WhatsApp
zůstává místem, kde se lidé domluví. Tenhle nástroj jen odstraňuje chaos.

## Princip (workflow)

1. **Vytvořit hru** — rychlý formulář (jméno, datum, čas, úroveň, typ, kolik
   hráčů hledáš).
2. **Poslat pozvánku** — appka vygeneruje hezký text a otevře WhatsApp s
   předvyplněnou zprávou (`wa.me`). Vybereš skupinu a pošleš. Bonus: stažení
   obrázkové kartičky pro „hezké" pozvánky nebo turnaje.
3. **Přehled** — hra se zobrazí v seznamu otevřených her.
4. **Obsazenost ručně** — tlačítka **+ / −**, „Označit plno", „Uzavřít".
   Stav: *Hledáme N hráče* → *Plno*. Žádné automatické přihlašování.

## Soubory

```
/index.html                  – kostra
/css/styles.css              – styl v barvách Padel Klatovy (mobil-first)
/js/dataService.js           – datová vrstva (mock/local přes localStorage)
/js/dataService.supabase.js  – stejné API napojené na sdílený Supabase
/js/invite.js                – generátor WhatsApp textu + wa.me + obrázek
/js/app.js                   – přehled, počítadlo, formulář, sdílení
/supabase/schema.sql         – tabulka matches + ukázková data
/assets/logo.png             – logo klubu
```

## Spuštění lokálně

```bash
cd hledam-hru
python3 -m http.server 8000
# http://localhost:8000
```

Běží rovnou na mock datech (localStorage). Tlačítko „Obnovit ukázková data"
dole vrátí výchozí stav.

## Sdílený přehled pro celou komunitu (Supabase)

Aby přehled her viděli všichni (ne jen lokálně v jednom prohlížeči):

1. Založ projekt na https://supabase.com.
2. V **SQL Editor** spusť obsah `supabase/schema.sql`.
3. V `js/dataService.supabase.js` doplň `SUPABASE_URL` a `SUPABASE_ANON_KEY`
   (Project Settings → API).
4. V `index.html` nahraď `<script src="js/dataService.js"></script>` za:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="js/dataService.supabase.js"></script>
   ```

Obě verze mají stejné API, takže zbytek appky se nemění.

## Nasazení na GitHub Pages

Nahraj obsah složky do repozitáře → Settings → Pages → Deploy from a branch
(main / root). Žádný build krok.

## Připraveno na Paysy
Až bude k dispozici Paysy API, lze k tabulce her doplnit odkaz na rezervaci
(stejný princip jako u hlavní appky) — modul sdílení i přehledu zůstane.

## Co nástroj záměrně NEdělá
Žádný chat, komentáře, lajky, profily, messenger ani feed. Bar má vlastní
appku — je dostupný jen jako odkaz dole.
