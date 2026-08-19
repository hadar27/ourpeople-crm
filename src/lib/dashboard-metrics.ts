// Chart-data derivation shared by the dashboard and reports pages.
import type { DonationRecord } from "./queries/donations";

const HEBREW_MONTHS = [
  "ינו׳",
  "פבר׳",
  "מרץ",
  "אפר׳",
  "מאי",
  "יוני",
  "יולי",
  "אוג׳",
  "ספט׳",
  "אוק׳",
  "נוב׳",
  "דצמ׳",
];

/** Donation totals for the last `months` calendar months present in the data, oldest first. */
export function monthlyDonationTotals(donations: DonationRecord[], months = 6) {
  const totals = new Map<string, number>();
  donations.forEach((d) => {
    const key = d.date.slice(0, 7);
    totals.set(key, (totals.get(key) ?? 0) + d.amount);
  });
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months)
    .map(([key, amount]) => ({ month: HEBREW_MONTHS[Number(key.slice(5, 7)) - 1], amount }));
}
