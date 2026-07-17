export function formatMoney(cents: number, currency = "CZK") {
  if (cents === 0) return "Zdarma";
  const value = cents / 100;
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "2026-07-21" -> "úterý 21. července 2026" (jako lokální datum, ne UTC) */
export function formatDay(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("cs-CZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "13:05" -> "13:05" (24h formát, bez úvodní nuly u hodin) */
export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
