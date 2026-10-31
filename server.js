const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const port = Number(process.env.PORT || 3000);
const databasePath = path.resolve(
  process.env.BOOKING_DB_PATH || path.join(__dirname, "storage", "bookings.sqlite"),
);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma("journal_mode = WAL");
database.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    date TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service TEXT NOT NULL,
    package TEXT NOT NULL,
    location TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const isDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const readField = (value) => (typeof value === "string" ? value.trim() : "");

const findBooking = database.prepare("SELECT 1 FROM bookings WHERE date = ?");
const insertBooking = database.prepare(`
  INSERT INTO bookings (date, name, phone, service, package, location, notes)
  VALUES (@date, @name, @phone, @service, @package, @location, @notes)
  ON CONFLICT(date) DO NOTHING
`);

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb", strict: true }));

app.get("/api/availability", (request, response) => {
  const date = request.query.date;
  if (!isDate(date)) {
    response.status(400).json({ error: "Tanggal tidak valid." });
    return;
  }

  response.json({ date, available: !findBooking.get(date) });
});

app.post("/api/bookings", (request, response) => {
  const body = request.body && typeof request.body === "object" && !Array.isArray(request.body)
    ? request.body
    : {};
  const booking = {
    name: readField(body.name),
    phone: readField(body.phone),
    service: readField(body.service),
    package: readField(body.package),
    date: body.date,
    location: readField(body.location),
    notes: readField(body.notes),
  };

  if (
    !booking.name ||
    !booking.phone ||
    !booking.service ||
    !booking.package ||
    !booking.location ||
    !isDate(booking.date)
  ) {
    response.status(400).json({ error: "Data booking tidak lengkap atau tanggal tidak valid." });
    return;
  }

  if (!/,\s*Kota Palembang,\s*Sumatera Selatan$/i.test(booking.location)) {
    response.status(400).json({
      error: "Layanan booking hanya tersedia di Kota Palembang, Sumatera Selatan.",
    });
    return;
  }

  if (
    booking.name.length > 120 ||
    booking.phone.length > 40 ||
    booking.service.length > 100 ||
    booking.package.length > 100 ||
    booking.location.length > 160 ||
    booking.notes.length > 1000
  ) {
    response.status(400).json({ error: "Ada data booking yang melebihi batas panjang." });
    return;
  }

  const result = insertBooking.run(booking);
  if (result.changes === 0) {
    response.status(409).json({
      error: "date_full",
      message: "Maaf, tanggal ini telah penuh. Silakan pilih tanggal yang lain.",
    });
    return;
  }

  response.status(201).json({ success: true, date: booking.date });
});

const publicFiles = {
  "/": "index.html",
  "/index.html": "index.html",
  "/styles.css": "styles.css",
  "/script.js": "script.js",
};

app.get(Object.keys(publicFiles), (request, response) => {
  const fileName = publicFiles[request.path];
  response.sendFile(path.join(__dirname, fileName));
});

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "Endpoint tidak ditemukan." });
});

app.use((_request, response) => {
  response.status(404).type("text").send("Halaman tidak ditemukan.");
});

app.use((error, _request, response, _next) => {
  if (error.type === "entity.too.large") {
    response.status(413).json({ error: "Ukuran data booking terlalu besar." });
    return;
  }
  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ error: "Format data booking tidak valid." });
    return;
  }

  console.error("Kesalahan server:", error);
  if (!response.headersSent) {
    response.status(500).json({ error: "Terjadi kesalahan server. Silakan coba lagi." });
  }
});

app.listen(port, () => {
  console.log(`CV. Cahaya Mandiri berjalan di http://localhost:${port}`);
  console.log(`Database booking: ${databasePath}`);
});
