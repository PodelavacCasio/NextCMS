import type { OrderStatus, BookingStatus } from "./types";

// Stavy se v databázi ukládají anglicky (stabilní interní hodnoty);
// tady jsou jejich české popisky pro zobrazení.

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Nová",
  processing: "Zpracovává se",
  shipped: "Odeslána",
  completed: "Dokončena",
  cancelled: "Zrušena",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Čeká na potvrzení",
  confirmed: "Potvrzena",
  cancelled: "Zrušena",
};

export const DAY_NAMES = [
  "neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota",
];

export const DAY_ABBREV = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
