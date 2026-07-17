/** All slot start times for one day, given business hours from settings. */
export function buildSlots(openHour: number, closeHour: number, slotMinutes: number) {
  const slots: string[] = [];
  for (let mins = openHour * 60; mins + slotMinutes <= closeHour * 60; mins += slotMinutes) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
}
