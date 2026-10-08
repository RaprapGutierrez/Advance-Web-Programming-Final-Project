const { db } = require("./store");
const { quote, r2 } = require("./lib/pricing");
const B = require("./lib/bookings");
const Studio = require("./models/Studio");
const Equipment = require("./models/Equipment");
const Renter = require("./models/Renter");
const User = require("./models/User");
const Booking = require("./models/Booking");
const Payment = require("./models/Payment");

module.exports = async function seed() {
  if ((await Renter.countDocuments()) === 0) {
    await Renter.insertMany(
      [
        ["Dani Villanueva", "dani"],
        ["Kai Ramos", "kai"],
        ["Mika Tan", "mika"],
        ["Paolo Dizon", "paolo"],
        ["Rina Lacson", "rina"],
        ["Tomas Aquino", "tomas"],
      ].map(([name, h], i) => ({
        _id: `r${i + 1}`,
        name,
        email: `${h}@example.com`,
        phone: `0917555010${i}`,
      })),
    );
  }
  // login accounts for the sample renters (password: Password123)
  const sampleRenters = await Renter.find({
    _id: { $in: ["r1", "r2", "r3", "r4", "r5", "r6"] },
  });
  for (const r of sampleRenters) {
    if (!(await User.exists({ email: r.email }))) {
      await User.create({
        name: r.name,
        email: r.email,
        password: "Password123",
        role: "customer",
      });
    }
  }
  const customers = await User.find({ role: "customer" });
  for (const u of customers) {
    if (
      !(await Renter.exists({
        $or: [{ _id: u._id.toString() }, { email: u.email }],
      }))
    ) {
      await Renter.create({
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: "N/A",
      });
    }
  }
  await Renter.syncMemory();
  if ((await Studio.countDocuments()) === 0) {
    await Studio.insertMany([
      {
        _id: "s1",
        name: "Echo Room",
        type: "Music",
        capacity: 6,
        peakRate: 700,
        offPeakRate: 450,
        openHour: 9,
        closeHour: 23,
        description: "Soundproofed band room with a drum riser and amp wall.",
      },
      {
        _id: "s2",
        name: "Lumen Studio",
        type: "Photo",
        capacity: 8,
        peakRate: 900,
        offPeakRate: 600,
        openHour: 9,
        closeHour: 21,
        description: "Daylight cyclorama with a seamless white wall.",
      },
      {
        _id: "s3",
        name: "Mirror Hall",
        type: "Dance",
        capacity: 20,
        peakRate: 550,
        offPeakRate: 350,
        openHour: 10,
        closeHour: 22,
        description: "Sprung floor, full mirror wall and a sound system.",
      },
      {
        _id: "s4",
        name: "Booth 3",
        type: "Podcast",
        capacity: 4,
        peakRate: 500,
        offPeakRate: 300,
        openHour: 8,
        closeHour: 20,
        description: "Treated booth with four mic stations.",
      },
    ]);
  }
  const studios = (await Studio.find().lean()).map((s) => ({
    ...s,
    id: s._id,
  }));
  await Studio.syncMemory();
  if ((await Equipment.countDocuments()) === 0) {
    await Equipment.insertMany([
      { _id: "q1", name: "Condenser mic", fee: 150, quantity: 3 },
      { _id: "q2", name: "Softbox lights", fee: 250, quantity: 2 },
      { _id: "q3", name: "Drum kit", fee: 400, quantity: 1 },
      { _id: "q4", name: "Backdrop set", fee: 200, quantity: 2 },
      { _id: "q5", name: "Bluetooth speaker", fee: 100, quantity: 2 },
    ]);
  }
  await Equipment.syncMemory();
  const day = (off) =>
    new Date(
      Date.now() + off * 86400000 - new Date().getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 10);
  let n = 0,
    p = 0;
  const bookingDocs = [];
  const paymentDocs = [];
  const mk = (renterId, studioId, off, start, end, eq, status, frac = 0) => {
    const studio = studios.find((s) => s.id === studioId);
    const { rate } = B.tierFor(B.completedCount(renterId));
    const b = {
      id: `b${++n}`,
      renterId,
      studioId,
      date: day(off),
      startHour: start,
      endHour: end,
      guests: 2,
      equipmentIds: eq,
      status,
      discountRate: rate,
      ...quote(studio, start, end, eq, rate),
    };
    db.bookings.push(b);
    bookingDocs.push(b);
    if (frac) {
      const pay = {
        id: `p${++p}`,
        bookingId: b.id,
        amount: r2(b.total * frac),
        method: p % 2 ? "gcash" : "cash",
        date: day(Math.min(off, 0)),
      };
      db.payments.push(pay);
      paymentDocs.push(pay);
    }
  };
  mk("r1", "s1", -20, 10, 12, [], "completed", 1);
  mk("r1", "s2", -18 + 6, 10, 13, ["q2"], "completed", 1);
  mk("r1", "s1", -15, 18, 21, ["q1"], "completed", 1);
  mk("r1", "s1", -9, 14, 16, [], "completed", 1);
  mk("r1", "s1", -4, 19, 22, ["q3"], "completed", 1);
  mk("r2", "s2", -18, 13, 16, ["q4"], "completed", 1);
  mk("r2", "s3", -7, 17, 19, [], "completed", 1);
  mk("r3", "s3", -10, 10, 12, [], "completed", 1);
  mk("r3", "s4", -6, 9, 11, ["q1"], "completed", 1);
  mk("r4", "s1", -13, 12, 15, [], "completed", 1);
  mk("r5", "s4", -3, 14, 16, [], "completed", 1);
  mk("r4", "s2", -5, 15, 18, ["q2"], "confirmed", 0.5);
  mk("r6", "s3", -2, 18, 20, [], "confirmed", 0);
  mk("r2", "s1", 1, 18, 21, ["q3"], "confirmed", 0);
  mk("r3", "s2", 1, 10, 12, [], "pending");
  mk("r5", "s3", 2, 17, 20, ["q5"], "confirmed", 0.5);
  mk("r6", "s4", 3, 9, 12, [], "pending");
  mk("r1", "s2", 3, 13, 15, ["q4"], "confirmed", 0);
  mk("r4", "s1", 0, 20, 22, [], "confirmed", 0);
  if ((await Booking.countDocuments()) === 0) {
    await Booking.insertMany(
      bookingDocs.map(({ id, ...rest }) => ({ _id: id, ...rest })),
    );
    await Payment.insertMany(
      paymentDocs.map(({ id, ...rest }) => ({ _id: id, ...rest })),
    );
  }
  await Booking.syncMemory();
  await Payment.syncMemory();
};
