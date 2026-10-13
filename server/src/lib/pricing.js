const { db } = require("../store");
const r2 = (n) => Math.round(n * 100) / 100;
const PEAK_FROM = 17; // hours from 17:00 onward use the peak rate

function quote(studio, startHour, endHour, equipmentIds, discountRate) {
  let peakHours = 0;
  for (let h = startHour; h < endHour; h++) if (h >= PEAK_FROM) peakHours++;
  const hours = endHour - startHour;
  const subtotal = r2(
    peakHours * studio.peakRate + (hours - peakHours) * studio.offPeakRate,
  );
  const addOns = r2(
    equipmentIds.reduce(
      (s, id) => s + (db.equipment.find((e) => e.id === id)?.fee ?? 0),
      0,
    ),
  );
  const discount = r2(subtotal * discountRate);
  return {
    hours,
    peakHours,
    subtotal,
    addOns,
    discount,
    total: r2(subtotal + addOns - discount),
  };
}
// Loyalty discount based on how many bookings the renter has
function loyaltyRate(count) {
  if (count > 20) return 0.15;
  if (count >= 15) return 0.1;
  if (count >= 5) return 0.05;
  return 0;
}

module.exports = { quote, r2, PEAK_FROM, loyaltyRate };
