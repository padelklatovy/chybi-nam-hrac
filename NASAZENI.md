# Nasazení appky „Chybí nám hráč" na GitHub Pages

Tento návod tě provede zveřejněním appky tak, aby šla otevřít na telefonu
přes odkaz. Není potřeba nic instalovat ani umět programovat.

Appka pojede na adrese typu:
**https://padelklatovy.github.io/chybi-nam-hrac/**

---

## Co budeš potřebovat
- účet na GitHubu (ten samý, na kterém běží bar),
- soubory z tohoto balíčku (složka se všemi soubory).

---

## Krok 1 — Vytvoř nový repozitář
1. Přihlas se na https://github.com.
2. Vpravo nahoře klikni na **+** → **New repository**.
3. **Repository name** napiš: `chybi-nam-hrac`
   (tahle část se objeví v adrese appky).
4. Nech **Public**.
5. NEzaškrtávej „Add a README" (soubor už máš v balíčku).
6. Klikni **Create repository**.

## Krok 2 — Nahraj soubory
1. Na stránce nového (prázdného) repozitáře klikni na odkaz
   **uploading an existing file** (uprostřed stránky),
   nebo na tlačítko **Add file → Upload files**.
2. Otevři složku s appkou v počítači, **označ úplně všechno uvnitř**
   (index.html, manifest.json, složky css, js, assets, supabase…)
   a přetáhni to do okna prohlížeče.
   - DŮLEŽITÉ: nahrávej *obsah* složky, ne složku samotnou. Soubor
     `index.html` musí být v repozitáři nahoře, ne schovaný v podsložce.
3. Dole klikni na zelené **Commit changes**.

## Krok 3 — Zapni GitHub Pages
1. V repozitáři jdi nahoře na **Settings** (ozubené kolo).
2. V levém menu klikni na **Pages**.
3. V sekci *Build and deployment* u položky **Source** zvol
   **Deploy from a branch**.
4. U **Branch** vyber **main** a složku nech **/ (root)**. Klikni **Save**.
5. Chvíli počkej (klidně 1–2 minuty). Nahoře se objeví zelený rámeček
   s adresou typu `https://padelklatovy.github.io/chybi-nam-hrac/`.

## Krok 4 — Otevři a vyzkoušej
1. Klikni na tu adresu (nebo ji pošli sám sobě do WhatsAppu a otevři na
   telefonu).
2. Měla by naběhnout appka — clubhouse vzhled, tlačítko „Vytvořit hru",
   ukázkové hry.
3. Na telefonu si ji můžeš přidat na plochu jako ikonu:
   v Safari **Sdílet → Přidat na plochu**.

---

## Aktualizace appky později
Když budeš chtít něco změnit: v repozitáři otevři daný soubor,
klikni na tužku (Edit), uprav, **Commit changes**. Za chvíli se změna
projeví na živé adrese sama.

---

## Důležité: data jsou zatím jen v telefonu
V téhle verzi se hry ukládají **lokálně v prohlížeči** každého člověka
zvlášť — takže každý vidí jen svoje. To je v pořádku pro první test
workflow (vytvoř hru → pošli pozvánku do WhatsApp).

Až budeš chtít **sdílený přehled pro celou komunitu** (všichni vidí
stejné hry), použije se Supabase — návod je ve složce `supabase/`
a v souboru `README.md`. Tu část napojíme, až bude appka odzkoušená.

---

## Když něco nefunguje
- **Bílá stránka / kód místo appky:** nahrál se `index.html` do podsložky.
  Musí být v kořeni repozitáře. Smaž a nahraj znovu obsah složky.
- **Nenačte se logo nebo styl:** zkontroluj, že se nahrály i složky
  `css`, `js` a `assets` (ne jen index.html).
- **Stránka 404:** Pages se ještě nestihly sestavit, počkej minutu a
  načti znovu. Taky zkontroluj, že adresa končí lomítkem `/`.
