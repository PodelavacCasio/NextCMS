import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type {
  Product, Post, Booking, Order, Settings,
  BookingStatus, OrderStatus, OrderItem,
} from "./types";

// Data layer backed by Node's built-in SQLite (node:sqlite, stable since
// Node 24.4) — a real ACID database with zero npm dependencies. Everything
// lives in one file, data/site.db, which any SQLite browser can open.
//
// On first run the database is seeded with sample content. If legacy
// data/*.json files from the JSON-file era exist, they are imported instead
// and renamed to *.json.imported.

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "site.db");

let _db: DatabaseSync | null = null;

function db(): DatabaseSync {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  _db = new DatabaseSync(DB_PATH);
  _db.exec("PRAGMA journal_mode = WAL");
  _db.exec("PRAGMA foreign_keys = ON");
  migrate(_db);
  return _db;
}

function migrate(d: DatabaseSync) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      priceCents INTEGER NOT NULL CHECK (priceCents >= 0),
      image TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'General',
      stock INTEGER NOT NULL CHECK (stock >= 0),
      featured INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      coverImage TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT '',
      published INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      serviceId TEXT NOT NULL,
      serviceName TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('pending','confirmed','cancelled')),
      createdAt TEXT NOT NULL
    );

    -- The storage layer itself forbids double-booking a live slot.
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_slot
      ON bookings(date, time) WHERE status != 'cancelled';

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      itemsJson TEXT NOT NULL,
      customerName TEXT NOT NULL,
      customerEmail TEXT NOT NULL,
      customerPhone TEXT NOT NULL DEFAULT '',
      customerAddress TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      totalCents INTEGER NOT NULL CHECK (totalCents >= 0),
      status TEXT NOT NULL CHECK (status IN ('new','processing','shipped','completed','cancelled')),
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      json TEXT NOT NULL
    );
  `);

  const empty =
    (d.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number }).n === 0 &&
    (d.prepare("SELECT COUNT(*) AS n FROM posts").get() as { n: number }).n === 0 &&
    (d.prepare("SELECT COUNT(*) AS n FROM settings").get() as { n: number }).n === 0;
  if (empty) seed(d);
}

// ------------------------------------------------------------------- utils

export function newId() {
  return crypto.randomBytes(6).toString("hex");
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // odstranit diakritiku (š → s, ě → e…)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "bez-nazvu";
}

/** Make slug unique within a table, ignoring the record being edited. */
function uniqueSlugIn(table: "products" | "posts", base: string, selfId: string) {
  const stmt = db().prepare(
    `SELECT COUNT(*) AS n FROM ${table} WHERE slug = ? AND id != ?`
  );
  let slug = base;
  let n = 2;
  while ((stmt.get(slug, selfId) as { n: number }).n > 0) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

/** Read a legacy JSON collection file, then rename it so it is not re-imported. */
function takeLegacyJson<T>(name: string): T | null {
  const file = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8")) as T;
    fs.renameSync(file, `${file}.imported`);
    return data;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------------- seed

const DEFAULT_SETTINGS: Settings = {
  siteName: "Forma Studio",
  tagline: "Ruční výroba a studiové služby",
  heroTitle: "Předměty vyráběné pomalu, na každodenní používání.",
  heroText:
    "Forma je malé studio, které v limitovaných sériích vyrábí keramiku, textil a výrobky ze dřeva. Prohlédněte si obchod, přečtěte si blog nebo si rezervujte čas u nás ve studiu.",
  currency: "CZK",
  contactEmail: "ahoj@formastudio.example",
  contactPhone: "+420 601 020 300",
  address: "Zakladatelská 14, Praha 7",
  aboutText:
    "Forma Studio je dvoučlenná dílna založená v roce 2021. Vše navrhujeme a vyrábíme na místě, v malých sériích a z materiálů, u kterých známe původ.",
  openHour: 9,
  closeHour: 17,
  slotMinutes: 60,
  openDays: [1, 2, 3, 4, 5],
  services: [
    { id: "svc-visit", name: "Prohlídka studia", durationMin: 60, priceCents: 0 },
    { id: "svc-wheel", name: "Úvodní lekce točení na kruhu", durationMin: 60, priceCents: 240000 },
    { id: "svc-consult", name: "Konzultace zakázkové výroby", durationMin: 60, priceCents: 110000 },
  ],
};

function seed(d: DatabaseSync) {
  const now = new Date().toISOString();

  const products: Product[] = takeLegacyJson<Product[]>("products") ?? [
    {
      id: "p-ceramic-mug", slug: "keramicky-hrnek-ze-studia", name: "Keramický hrnek ze studia",
      description:
        "Ručně točený kameninový hrnek s matnou grafitovou glazurou. Objem 350 ml. Každý kus je trochu jiný — a přesně o to jde.",
      priceCents: 89000, image: "", category: "Keramika", stock: 24, featured: true, createdAt: now,
    },
    {
      id: "p-linen-apron", slug: "zastera-z-praneho-lnu", name: "Zástěra z praného lnu",
      description:
        "Těžký evropský len, předepraný pro měkkost. Zkřížené šle na zádech, dvě přední kapsy, univerzální velikost.",
      priceCents: 169000, image: "", category: "Textil", stock: 12, featured: true, createdAt: now,
    },
    {
      id: "p-oak-board", slug: "dubove-servirovaci-prkenko", name: "Dubové servírovací prkénko",
      description:
        "Servírovací prkénko z masivního dubu, ošetřené potravinářským olejem a včelím voskem. 40 × 20 cm s koženým poutkem na zavěšení.",
      priceCents: 135000, image: "", category: "Dřevo", stock: 8, featured: true, createdAt: now,
    },
    {
      id: "p-candle-set", slug: "sada-svicek-ze-vceliho-vosku", name: "Sada svíček ze včelího vosku",
      description:
        "Sada tří ručně máčených svíček ze včelího vosku. Pomalu hoří, přirozeně voní medem, výška 25 cm.",
      priceCents: 59000, image: "", category: "Domácnost", stock: 40, featured: false, createdAt: now,
    },
  ];

  const posts: Post[] = takeLegacyJson<Post[]>("posts") ?? [
    {
      id: "post-welcome", slug: "vitejte-ve-studiu", title: "Vítejte ve studiu",
      excerpt:
        "Krátké představení: kdo jsme, co vyrábíme a proč tu všechno vzniká ručně.",
      content:
        "## Proč jsme studio založili\n\nZaložili jsme ho s jednoduchou myšlenkou: vyrábět méně věcí, ale pořádně.\n\nVšechno v obchodě vzniká v malých sériích. Když se něco vyprodá, vrátí se, až to bude hotové — ne dřív.\n\n## Co u nás najdete\n\n- Keramiku točenou na kruhu, kus po kusu\n- Textil střižený a šitý přímo v dílně\n- Výrobky ze dřeva z místních zdrojů\n\nJestli chcete vidět, jak to celé vzniká, **rezervujte si prohlídku studia** na stránce rezervací. Rádi vás provedeme.\n\n*— Tým studia*",
      coverImage: "", author: "Tým studia", published: true, createdAt: now, updatedAt: now,
    },
    {
      id: "post-care", slug: "pece-o-rucne-vyrabenou-keramiku", title: "Péče o ručně vyráběnou keramiku",
      excerpt:
        "Ručně vyráběná kamenina vydrží celý život, když se o ni trochu staráte. Tady je vše, co potřebujete vědět.",
      content:
        "Ručně vyráběná kamenina je odolnější, než vypadá, ale pár návyků jí pomůže vypadat skvěle desítky let.\n\n## Každodenní péče\n\n- Nejšetrnější je mytí v ruce, i když naše glazury myčku snesou\n- Vyhněte se teplotnímu šoku: nedávejte kus rovnou z lednice do trouby\n- Neglazované dno lze v případě drsnosti přebrousit jemným smirkovým papírem\n\n## Skvrny a šmouhy\n\nStopy po příborech odstraníte pastou z jedlé sody a vody. Na čajové zabarvení uvnitř hrnků skvěle funguje krátká lázeň ve zředěném bílém octě.\n\nMáte dotaz ke konkrétnímu kusu? [Ozvěte se nám](/contact) a poradíme.",
      coverImage: "", author: "Tým studia", published: true, createdAt: now, updatedAt: now,
    },
  ];

  const bookings = takeLegacyJson<Booking[]>("bookings") ?? [];
  const orders = takeLegacyJson<Order[]>("orders") ?? [];
  const settings = { ...DEFAULT_SETTINGS, ...(takeLegacyJson<Partial<Settings>>("settings") ?? {}) };

  d.exec("BEGIN");
  try {
    const insP = d.prepare(
      `INSERT INTO products (id, slug, name, description, priceCents, image, category, stock, featured, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const p of products) {
      insP.run(p.id, p.slug, p.name, p.description, p.priceCents, p.image, p.category, p.stock, p.featured ? 1 : 0, p.createdAt);
    }
    const insPost = d.prepare(
      `INSERT INTO posts (id, slug, title, excerpt, content, coverImage, author, published, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const p of posts) {
      insPost.run(p.id, p.slug, p.title, p.excerpt, p.content, p.coverImage, p.author, p.published ? 1 : 0, p.createdAt, p.updatedAt);
    }
    const insB = d.prepare(
      `INSERT INTO bookings (id, serviceId, serviceName, date, time, name, email, phone, notes, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const b of bookings) {
      insB.run(b.id, b.serviceId, b.serviceName, b.date, b.time, b.name, b.email, b.phone, b.notes, b.status, b.createdAt);
    }
    const insO = d.prepare(
      `INSERT INTO orders (id, itemsJson, customerName, customerEmail, customerPhone, customerAddress, notes, totalCents, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const o of orders) {
      insO.run(o.id, JSON.stringify(o.items), o.customer.name, o.customer.email, o.customer.phone, o.customer.address, o.notes, o.totalCents, o.status, o.createdAt);
    }
    d.prepare("INSERT INTO settings (id, json) VALUES (1, ?)").run(JSON.stringify(settings));
    d.exec("COMMIT");
  } catch (err) {
    d.exec("ROLLBACK");
    throw err;
  }
}

// -------------------------------------------------------------- row mapping

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToProduct(r: any): Product {
  return { ...r, priceCents: Number(r.priceCents), stock: Number(r.stock), featured: !!r.featured };
}

function rowToPost(r: any): Post {
  return { ...r, published: !!r.published };
}

function rowToOrder(r: any): Order {
  return {
    id: r.id,
    items: JSON.parse(r.itemsJson) as OrderItem[],
    customer: {
      name: r.customerName,
      email: r.customerEmail,
      phone: r.customerPhone,
      address: r.customerAddress,
    },
    notes: r.notes,
    totalCents: Number(r.totalCents),
    status: r.status as OrderStatus,
    createdAt: r.createdAt,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ----------------------------------------------------------------- products

export function getProducts(): Product[] {
  return db().prepare("SELECT * FROM products ORDER BY createdAt").all().map(rowToProduct);
}

export function getProduct(idOrSlug: string): Product | undefined {
  const row = db().prepare("SELECT * FROM products WHERE id = ? OR slug = ?").get(idOrSlug, idOrSlug);
  return row ? rowToProduct(row) : undefined;
}

/** Insert or update; slug is (re)derived from the name. */
export function upsertProduct(p: Omit<Product, "slug">): Product {
  const slug = uniqueSlugIn("products", slugify(p.name), p.id);
  db().prepare(
    `INSERT INTO products (id, slug, name, description, priceCents, image, category, stock, featured, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       slug = excluded.slug, name = excluded.name, description = excluded.description,
       priceCents = excluded.priceCents, image = excluded.image, category = excluded.category,
       stock = excluded.stock, featured = excluded.featured`
  ).run(p.id, slug, p.name, p.description, p.priceCents, p.image, p.category, p.stock, p.featured ? 1 : 0, p.createdAt);
  return { ...p, slug };
}

export function deleteProduct(id: string) {
  db().prepare("DELETE FROM products WHERE id = ?").run(id);
}

// -------------------------------------------------------------------- posts

export function getPosts(): Post[] {
  return db().prepare("SELECT * FROM posts ORDER BY createdAt DESC").all().map(rowToPost);
}

export function getPost(idOrSlug: string): Post | undefined {
  const row = db().prepare("SELECT * FROM posts WHERE id = ? OR slug = ?").get(idOrSlug, idOrSlug);
  return row ? rowToPost(row) : undefined;
}

export function upsertPost(p: Omit<Post, "slug">): Post {
  const slug = uniqueSlugIn("posts", slugify(p.title), p.id);
  db().prepare(
    `INSERT INTO posts (id, slug, title, excerpt, content, coverImage, author, published, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       slug = excluded.slug, title = excluded.title, excerpt = excluded.excerpt,
       content = excluded.content, coverImage = excluded.coverImage, author = excluded.author,
       published = excluded.published, updatedAt = excluded.updatedAt`
  ).run(p.id, slug, p.title, p.excerpt, p.content, p.coverImage, p.author, p.published ? 1 : 0, p.createdAt, p.updatedAt);
  return { ...p, slug };
}

export function deletePost(id: string) {
  db().prepare("DELETE FROM posts WHERE id = ?").run(id);
}

// ----------------------------------------------------------------- bookings

export function getBookings(): Booking[] {
  return db().prepare("SELECT * FROM bookings ORDER BY date DESC, time DESC").all() as unknown as Booking[];
}

export function getBookedTimes(date: string): string[] {
  return (
    db()
      .prepare("SELECT time FROM bookings WHERE date = ? AND status != 'cancelled'")
      .all(date) as unknown as { time: string }[]
  ).map((r) => r.time);
}

/**
 * Insert a booking. Returns false if the slot is already taken — enforced by
 * a unique index, so two simultaneous requests can never both succeed.
 */
export function addBooking(b: Booking): boolean {
  try {
    db().prepare(
      `INSERT INTO bookings (id, serviceId, serviceName, date, time, name, email, phone, notes, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(b.id, b.serviceId, b.serviceName, b.date, b.time, b.name, b.email, b.phone, b.notes, b.status, b.createdAt);
    return true;
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE")) return false;
    throw err;
  }
}

export function setBookingStatus(id: string, status: BookingStatus): boolean {
  try {
    const res = db().prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, id);
    return res.changes > 0;
  } catch (err) {
    // Un-cancelling into a slot that has since been rebooked violates the
    // unique index — report failure instead of corrupting the calendar.
    if (err instanceof Error && err.message.includes("UNIQUE")) return false;
    throw err;
  }
}

// ------------------------------------------------------------------- orders

export function getOrders(): Order[] {
  return db().prepare("SELECT * FROM orders ORDER BY createdAt DESC").all().map(rowToOrder);
}

export function getOrder(id: string): Order | undefined {
  const row = db().prepare("SELECT * FROM orders WHERE id = ?").get(id);
  return row ? rowToOrder(row) : undefined;
}

export type CreateOrderResult =
  | { ok: true; order: Order }
  | { ok: false; error: string; status: number };

/**
 * Validate items against live stock, decrement stock, and insert the order —
 * all in one transaction, so concurrent checkouts can't oversell.
 */
export function createOrder(
  items: { productId: string; qty: number }[],
  customer: Order["customer"],
  notes: string
): CreateOrderResult {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const orderItems: OrderItem[] = [];
    for (const item of items) {
      const qty = Math.floor(Number(item.qty));
      if (!Number.isFinite(qty) || qty < 1) continue;
      const row = d.prepare("SELECT * FROM products WHERE id = ?").get(item.productId);
      if (!row) {
        d.exec("ROLLBACK");
        return { ok: false, error: "Některá položka ve vašem košíku už není dostupná.", status: 409 };
      }
      const product = rowToProduct(row);
      if (product.stock < qty) {
        d.exec("ROLLBACK");
        return { ok: false, error: `Z produktu „${product.name}“ zbývá skladem už jen ${product.stock} ks.`, status: 409 };
      }
      orderItems.push({ productId: product.id, name: product.name, priceCents: product.priceCents, qty });
    }
    if (orderItems.length === 0) {
      d.exec("ROLLBACK");
      return { ok: false, error: "Váš košík je prázdný.", status: 400 };
    }

    const dec = d.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
    for (const item of orderItems) dec.run(item.qty, item.productId);

    const order: Order = {
      id: newId(),
      items: orderItems,
      customer,
      notes,
      totalCents: orderItems.reduce((sum, i) => sum + i.priceCents * i.qty, 0),
      status: "new",
      createdAt: new Date().toISOString(),
    };
    d.prepare(
      `INSERT INTO orders (id, itemsJson, customerName, customerEmail, customerPhone, customerAddress, notes, totalCents, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(order.id, JSON.stringify(order.items), customer.name, customer.email, customer.phone, customer.address, notes, order.totalCents, order.status, order.createdAt);

    d.exec("COMMIT");
    return { ok: true, order };
  } catch (err) {
    d.exec("ROLLBACK");
    throw err;
  }
}

export function setOrderStatus(id: string, status: OrderStatus) {
  db().prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
}

// ----------------------------------------------------------------- settings

export function getSettings(): Settings {
  const row = db().prepare("SELECT json FROM settings WHERE id = 1").get() as
    | { json: string }
    | undefined;
  // Merge over defaults so newly added settings fields get sensible values
  // even if the stored settings predate them.
  const stored = row ? (JSON.parse(row.json) as Partial<Settings>) : {};
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings: Settings) {
  db().prepare(
    "INSERT INTO settings (id, json) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json"
  ).run(JSON.stringify(settings));
}
