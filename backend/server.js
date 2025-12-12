require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" })); // req.body para JSON [web:782]

// Model
const CashoutSchema = new mongoose.Schema(
  {
    operationCode: { type: String, required: true, trim: true, index: true },
    operatorName: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ["pending", "paid", "rejected"],
      default: "pending",
      index: true
    },

    observacion: { type: String, default: "" },
    supervisorName: { type: String, default: "" }
  },
  { timestamps: true }
);

const Cashout = mongoose.model("Cashout", CashoutSchema);

// Routes
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, service: "general-cashouts", ts: Date.now() });
});

app.get("/api/cashouts", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "200", 10), 500);
  const status = req.query.status; // opcional: pending/paid/rejected

  const filter = {};
  if (status) filter.status = status;

  const items = await Cashout.find(filter).sort({ createdAt: -1 }).limit(limit);
  res.json(items);
});

app.post("/api/cashouts", async (req, res) => {
  const { operationCode, operatorName, company, observacion } = req.body || {};

  const doc = await Cashout.create({
    operationCode,
    operatorName,
    company,
    observacion: observacion || "",
    status: "pending"
  });

  res.status(201).json(doc);
});

app.patch("/api/cashouts/:id", async (req, res) => {
  const { id } = req.params;

  // Permitimos solo estos campos para evitar updates raros
  const allowed = ["status", "supervisorName", "observacion"];
  const update = {};
  for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];

  const updated = await Cashout.findByIdAndUpdate(id, update, { new: true });
  if (!updated) return res.status(404).json({ error: "Not found" });

  res.json(updated);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log("listening", PORT));

async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI env var");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("Mongo connected");

  app.listen(PORT, () => console.log(`API listening on ${PORT}`));
}

start().catch((err) => {
  console.error("Fatal:", err && err.stack ? err.stack : err);
  process.exit(1);
});

process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));
