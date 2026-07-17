"use server";

import fs from "node:fs";
import path from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getProducts, upsertProduct, deleteProduct as dbDeleteProduct,
  getPosts, upsertPost, deletePost as dbDeletePost,
  setOrderStatus, setBookingStatus,
  getSettings, saveSettings,
  newId,
} from "@/lib/db";
import { checkPassword, createSession, destroySession, requireAdmin } from "@/lib/auth";
import type { OrderStatus, BookingStatus, Service } from "@/lib/types";

// ------------------------------------------------------------------- auth

export async function login(_prev: { error: string } | null, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    return { error: "Nesprávné heslo." };
  }
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// ------------------------------------------------------------------ helpers

function str(formData: FormData, key: string, max = 500) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function cents(formData: FormData, key: string) {
  // Přijmout i českou desetinnou čárku ("890,50")
  const raw = String(formData.get(key) ?? "0").replace(",", ".");
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : 0;
}

/**
 * If an image file was uploaded, save it under public/uploads and return its
 * URL; otherwise return the URL typed into the text field.
 */
async function resolveImage(formData: FormData, urlField: string, fileField: string) {
  const file = formData.get(fileField);
  if (file instanceof File && file.size > 0) {
    if (file.size > 8 * 1024 * 1024) throw new Error("Obrázek je příliš velký (max. 8 MB).");
    const ext = path.extname(file.name).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif"].includes(ext)) {
      throw new Error("Nepodporovaný typ obrázku.");
    }
    const dir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(dir, { recursive: true });
    const name = `${newId()}${ext}`;
    fs.writeFileSync(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    return `/uploads/${name}`;
  }
  return str(formData, urlField, 1000);
}

// ----------------------------------------------------------------- products

export async function saveProduct(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id", 100);
  const existing = id ? getProducts().find((p) => p.id === id) : undefined;

  upsertProduct({
    id: existing?.id ?? newId(),
    name: str(formData, "name", 200) || "Produkt bez názvu",
    description: str(formData, "description", 5000),
    priceCents: cents(formData, "price"),
    image: await resolveImage(formData, "image", "imageFile"),
    category: str(formData, "category", 100) || "General",
    stock: Math.max(0, Math.floor(Number(formData.get("stock")) || 0)),
    featured: formData.get("featured") === "on",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  });
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  dbDeleteProduct(String(formData.get("id")));
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

// -------------------------------------------------------------------- posts

export async function savePost(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id", 100);
  const existing = id ? getPosts().find((p) => p.id === id) : undefined;

  upsertPost({
    id: existing?.id ?? newId(),
    title: str(formData, "title", 300) || "Článek bez názvu",
    excerpt: str(formData, "excerpt", 500),
    content: String(formData.get("content") ?? "").slice(0, 100_000),
    coverImage: await resolveImage(formData, "coverImage", "coverImageFile"),
    author: str(formData, "author", 100) || "Admin",
    published: formData.get("published") === "on",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  revalidatePath("/", "layout");
  redirect("/admin/posts");
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  dbDeletePost(String(formData.get("id")));
  revalidatePath("/", "layout");
  redirect("/admin/posts");
}

// ------------------------------------------------------------------- orders

const ORDER_STATUSES: OrderStatus[] = ["new", "processing", "shipped", "completed", "cancelled"];

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status")) as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) return;
  setOrderStatus(String(formData.get("id")), status);
  revalidatePath("/admin/orders");
}

// ----------------------------------------------------------------- bookings

const BOOKING_STATUSES: BookingStatus[] = ["pending", "confirmed", "cancelled"];

export async function updateBookingStatus(formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status")) as BookingStatus;
  if (!BOOKING_STATUSES.includes(status)) return;
  // May fail when un-cancelling into a slot that has since been rebooked;
  // in that case the list simply keeps showing the old status.
  setBookingStatus(String(formData.get("id")), status);
  revalidatePath("/admin/bookings");
}

// ----------------------------------------------------------------- settings

export async function updateSettings(formData: FormData) {
  await requireAdmin();
  const current = getSettings();

  // Services arrive as parallel indexed fields: svcName0, svcDuration0, svcPrice0...
  const services: Service[] = [];
  for (let i = 0; i < 20; i++) {
    const name = str(formData, `svcName${i}`, 200);
    if (!name) continue;
    const prevId = str(formData, `svcId${i}`, 100);
    services.push({
      id: prevId || newId(),
      name,
      durationMin: Math.max(5, Math.floor(Number(formData.get(`svcDuration${i}`)) || 60)),
      priceCents: cents(formData, `svcPrice${i}`),
    });
  }

  const openDays: number[] = [];
  for (let d = 0; d < 7; d++) {
    if (formData.get(`day${d}`) === "on") openDays.push(d);
  }

  const openHour = Math.min(23, Math.max(0, Math.floor(Number(formData.get("openHour")) || 9)));
  const closeHour = Math.min(24, Math.max(openHour + 1, Math.floor(Number(formData.get("closeHour")) || 17)));

  saveSettings({
    ...current,
    siteName: str(formData, "siteName", 100) || current.siteName,
    tagline: str(formData, "tagline", 200),
    heroTitle: str(formData, "heroTitle", 300),
    heroText: str(formData, "heroText", 1000),
    currency: str(formData, "currency", 10).toUpperCase() || "CZK",
    contactEmail: str(formData, "contactEmail", 200),
    contactPhone: str(formData, "contactPhone", 50),
    address: str(formData, "address", 300),
    aboutText: str(formData, "aboutText", 2000),
    openHour,
    closeHour,
    slotMinutes: Math.max(10, Math.floor(Number(formData.get("slotMinutes")) || 60)),
    openDays: openDays.length > 0 ? openDays : current.openDays,
    services: services.length > 0 ? services : current.services,
  });
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}
