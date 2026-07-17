export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  image: string;
  category: string;
  stock: number;
  featured: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  name: string;
  email: string;
  phone: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  priceCents: number;
  qty: number;
}

export type OrderStatus = "new" | "processing" | "shipped" | "completed" | "cancelled";

export interface Order {
  id: string;
  items: OrderItem[];
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  notes: string;
  totalCents: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
}

export interface Settings {
  siteName: string;
  tagline: string;
  heroTitle: string;
  heroText: string;
  currency: string; // e.g. "USD"
  contactEmail: string;
  contactPhone: string;
  address: string;
  aboutText: string;
  openHour: number; // 24h, first bookable hour
  closeHour: number; // 24h, bookings end before this hour
  slotMinutes: number;
  openDays: number[]; // 0=Sun ... 6=Sat
  services: Service[];
}

export interface CartItem {
  productId: string;
  qty: number;
}
