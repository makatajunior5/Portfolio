const express = require("express");
const cors = require("cors");
const { readPortfolio, writePortfolio } = require("./dataStore");

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_KEY = process.env.ADMIN_KEY || "admin123";

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/portfolio", async (_req, res) => {
  try {
    const data = await readPortfolio();
    res.json(data);
  } catch (_error) {
    res.status(500).json({ message: "Impossible de lire les donnees portfolio." });
  }
});

function ensureAdmin(req, res, next) {
  const providedKey = req.header("x-admin-key");
  if (!providedKey || providedKey !== ADMIN_KEY) {
    return res.status(401).json({ message: "Cle admin invalide." });
  }
  return next();
}

app.use("/api/admin", ensureAdmin);

app.get("/api/admin/portfolio", async (_req, res) => {
  try {
    const data = await readPortfolio();
    res.json(data);
  } catch (_error) {
    res.status(500).json({ message: "Impossible de lire les donnees admin." });
  }
});

app.put("/api/admin/portfolio", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ message: "Payload invalide." });
  }

  try {
    await writePortfolio(req.body);
    return res.json({ message: "Portfolio mis a jour." });
  } catch (_error) {
    return res.status(500).json({ message: "Impossible de sauvegarder le portfolio." });
  }
});

app.put("/api/admin/section/:section", async (req, res) => {
  const { section } = req.params;

  try {
    const data = await readPortfolio();
    data[section] = req.body;
    await writePortfolio(data);
    return res.json({ message: `Section ${section} mise a jour.`, data: data[section] });
  } catch (_error) {
    return res.status(500).json({ message: "Impossible de mettre a jour la section." });
  }
});

app.post("/api/admin/section/:section", async (req, res) => {
  const { section } = req.params;

  try {
    const data = await readPortfolio();
    if (!Array.isArray(data[section])) {
      return res.status(400).json({ message: "Cette section n'est pas une liste." });
    }
    data[section].push(req.body);
    await writePortfolio(data);
    return res.status(201).json({ message: "Element ajoute.", data: data[section] });
  } catch (_error) {
    return res.status(500).json({ message: "Impossible d'ajouter l'element." });
  }
});

app.put("/api/admin/section/:section/:index", async (req, res) => {
  const { section, index } = req.params;
  const numericIndex = Number(index);

  if (Number.isNaN(numericIndex)) {
    return res.status(400).json({ message: "Index invalide." });
  }

  try {
    const data = await readPortfolio();
    if (!Array.isArray(data[section])) {
      return res.status(400).json({ message: "Cette section n'est pas une liste." });
    }
    if (numericIndex < 0 || numericIndex >= data[section].length) {
      return res.status(404).json({ message: "Element introuvable." });
    }
    data[section][numericIndex] = req.body;
    await writePortfolio(data);
    return res.json({ message: "Element modifie.", data: data[section] });
  } catch (_error) {
    return res.status(500).json({ message: "Impossible de modifier l'element." });
  }
});

app.delete("/api/admin/section/:section/:index", async (req, res) => {
  const { section, index } = req.params;
  const numericIndex = Number(index);

  if (Number.isNaN(numericIndex)) {
    return res.status(400).json({ message: "Index invalide." });
  }

  try {
    const data = await readPortfolio();
    if (!Array.isArray(data[section])) {
      return res.status(400).json({ message: "Cette section n'est pas une liste." });
    }
    if (numericIndex < 0 || numericIndex >= data[section].length) {
      return res.status(404).json({ message: "Element introuvable." });
    }
    data[section].splice(numericIndex, 1);
    await writePortfolio(data);
    return res.json({ message: "Element supprime.", data: data[section] });
  } catch (_error) {
    return res.status(500).json({ message: "Impossible de supprimer l'element." });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Portfolio API is running on http://localhost:${PORT}`);
});
