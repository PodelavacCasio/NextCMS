# NextCMS — obchod, rezervace a blog v jedné Next.js aplikaci

Kompletní web pro malou firmu: e-shop, rezervace termínů v kalendáři, blog a
vestavěný redakční systém (CMS). Postaveno **pouze na Next.js, Reactu a
TypeScriptu** — žádná databáze třetí strany, žádné další runtime závislosti.

## Rychlý start

```bash
npm install
npm run dev        # vývojový režim, http://localhost:3000
```

Pro produkci:

```bash
npm run build
npm start
```

## Administrace / CMS

Otevřete **`/admin`** (odkaz „Správa webu“ je i v patičce) a přihlaste se
heslem z `.env.local`:

```
ADMIN_PASSWORD=admin123          # ← změňte!
SESSION_SECRET=…                 # ← změňte na libovolný dlouhý náhodný řetězec
```

V administraci můžete:

- **Produkty** — vytvářet, upravovat a mazat produkty; nastavovat cenu,
  skladové zásoby, kategorii, zvýraznění na úvodní stránce; přidávat obrázky
  přes URL nebo přímým nahráním.
- **Články** — psát články v jednoduchém markdownu (nadpisy, tučné písmo,
  kurzíva, seznamy, citace, odkazy, obrázky), ukládat koncepty, publikovat.
- **Objednávky** — sledovat příchozí objednávky a posouvat je stavy
  nová → zpracovává se → odeslána → dokončena (nebo zrušena).
- **Rezervace** — potvrzovat nebo rušit žádosti o rezervaci.
- **Nastavení** — název webu, texty úvodní stránky, kontaktní údaje, měna,
  otevírací hodiny, otevřené dny, délka termínu a seznam rezervovatelných
  služeb.

## Jak se ukládá obsah (přístupné i mimo CMS)

Veškerý obsah je v jediné SQLite databázi **`data/site.db`** přes vestavěný
modul Node.js `node:sqlite` (vyžaduje Node **24.4+**) — skutečná ACID databáze
bez jediné npm závislosti. Při prvním spuštění se vytvoří automaticky
i s ukázkovým obsahem.

- Běžná správa obsahu probíhá přes administraci.
- Pro přímý přístup otevřete `data/site.db` libovolným SQLite nástrojem
  (`sqlite3` CLI, DB Browser for SQLite, TablePlus, …). Schéma tvoří
  obyčejné tabulky: `products`, `posts`, `orders`, `bookings`, `settings`.
- Pokud existují starší soubory `data/*.json` z dřívější instalace,
  při prvním spuštění se naimportují a přejmenují na `*.json.imported`.

**Zálohu webu pořídíte zkopírováním `data/site.db` a `public/uploads/`.**
To je vše.

## Jak jednotlivé části fungují

- **Obchod** — košík se ukládá v prohlížeči návštěvníka; pokladna vytvoří
  objednávku (ceny i sklad se ověřují na serveru, zásoby se odečítají).
  Online platba se nevybírá — objednávky se platí při vyzvednutí či doručení,
  díky čemuž web nepotřebuje žádné závislosti. Platební bránu lze později
  napojit na jediném místě, kde objednávky vznikají:
  `app/api/orders/route.ts`.
- **Rezervace** — návštěvník vybere službu, den v kalendáři a volný čas.
  Termíny vycházejí z otevíracích hodin v Nastavení. Unikátní databázový
  index nad živými dvojicemi (datum, čas) činí dvojitou rezervaci nemožnou
  i při dvou současných požadavcích; pokladna obdobně ověřuje a odečítá
  sklad v jedné transakci, takže zboží nelze přeprodat.
- **Blog** — články se vykreslují malým vestavěným markdown rendererem
  (`lib/markdown.tsx`); nikdy se nevkládá surové HTML, obsah článků je tedy
  bezpečný.
- **Přihlášení** — jedno heslo správce (proměnná prostředí) a session cookie
  podepsaná HMAC přes vestavěný modul `crypto`. Přihlášení platí 12 hodin.

## Nasazení

Funguje na jakémkoli hostingu s Node 24.4+ (`npm run build && npm start`).
Databáze je lokální soubor, takže hosting potřebuje **trvalý disk** (VPS,
Railway volume, Fly volume apod.) — klasické, spolehlivé prostředí pro
SQLite. Serverless platformy s dočasným souborovým systémem (např. Vercel)
o průběžné úpravy přijdou — tam stačí vyměnit `lib/db.ts` za hostovanou
databázi; je to jediný soubor, který pracuje s úložištěm.
