// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch"; // para chamadas à API AbacatePay

dotenv.config();
const app = express();

// ⚡ CORS
app.use(
  cors({
    origin: [
      "https://flor-do-silencio.web.app", // frontend oficial
      "http://localhost:5173",            // ambiente dev
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

// ===============================
// 🔑 Config AbacatePay
// ===============================
const ABACATEPAY_URL = "https://api.abacatepay.com/v1";
const ABACATEPAY_KEY = process.env.ABACATEPAY_KEY;

// ===============================
// 📌 Rota - Cálculo de Frete
// ===============================
app.post("/shipping/calculate", async (req, res) => {
  try {
    const { cep } = req.body;
    console.log("📦 Cálculo de frete para CEP:", cep);

    if (!cep) return res.status(400).json({ error: "CEP obrigatório" });

    // Simulação de opções de frete
    const shippingOptions = [
      { id: 1, name: "PAC", price: 20, estimatedDays: 5 },
      { id: 2, name: "SEDEX", price: 40, estimatedDays: 2 },
    ];

    console.log("🚚 Opções de frete:", shippingOptions);
    res.json(shippingOptions);
  } catch (error) {
    console.error("❌ Erro no cálculo de frete:", error);
    res.status(500).json({ error: "Não foi possível calcular o frete", details: error.message });
  }
});

// ===============================
// 📌 AbacatePay - Criar Cobrança PIX ou Boleto
// ===============================
app.post("/abacatepay/charge", async (req, res) => {
  try {
    console.log("⚡ Criando cobrança AbacatePay:", req.body);
    const response = await fetch(`${ABACATEPAY_URL}/bill`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ABACATEPAY_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    console.log("✅ Resposta AbacatePay (Cobrança criada):", data);

    res.json(data);
  } catch (error) {
    console.error("❌ Erro ao criar cobrança AbacatePay:", error);
    res.status(500).json({ error: "Erro ao criar cobrança", details: error.message });
  }
});

// ===============================
// 📌 AbacatePay - Listar Cobranças
// ===============================
app.get("/abacatepay/bills", async (req, res) => {
  try {
    console.log("📋 Listando cobranças...");
    const response = await fetch(`${ABACATEPAY_URL}/bill`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ABACATEPAY_KEY}`,
      },
    });

    const data = await response.json();
    console.log("✅ Resposta AbacatePay (Bills):", data);

    res.json(data);
  } catch (error) {
    console.error("❌ Erro ao listar cobranças:", error);
    res.status(500).json({ error: "Erro ao listar cobranças", details: error.message });
  }
});

// ===============================
// 📌 AbacatePay - Checar Status da Cobrança
// ===============================
app.get("/abacatepay/status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Checando status da cobrança ID: ${id}`);

    const response = await fetch(`${ABACATEPAY_URL}/pix/charge/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ABACATEPAY_KEY}`,
      },
    });

    const data = await response.json();
    console.log("✅ Resposta AbacatePay (Status):", data);

    res.json(data);
  } catch (error) {
    console.error("❌ Erro ao checar status:", error);
    res.status(500).json({ error: "Erro ao checar status da cobrança", details: error.message });
  }
});

// ===============================
// 🚀 Rodar servidor
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
