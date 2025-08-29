import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";

dotenv.config();
const app = express();

// ⚡ CORS ajustado para frontend
app.use(cors({
  origin: [
    "https://flor-do-silencio.web.app",
    "http://localhost:5173",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

// Função para calcular frete grátis
const FREE_SHIPPING_MIN = 13000; // R$ 130,00 em centavos

// 📌 Rota de checkout AbacatePay
app.post("/checkout", async (req, res) => {
  try {
    const { customer, items, shipping, coupon, payment_method, amount } = req.body;

    console.log("✅ Recebido payload do frontend:", req.body); // 🔹 log do payload recebido

    if (!items?.length || !customer) {
      return res.status(400).json({ error: "Itens e dados do cliente são obrigatórios" });
    }

    // Se subtotal atingir mínimo de frete grátis, zera valor do frete
    let shippingAmount = shipping?.amount || 0;
    if (amount >= FREE_SHIPPING_MIN) {
      shippingAmount = 0;
    }

    const payload = {
      customer,
      items,
      shipping: {
        ...shipping,
        amount: shippingAmount,
      },
      coupon: coupon || null,
      totalAmount: amount + shippingAmount,
      payment_method: payment_method || "pix"
    };

    console.log("🚀 Payload enviado para AbacatePay:", payload); // 🔹 log do payload que será enviado para a API
    console.log("🔗 URL AbacatePay usada:", `${process.env.ABACATEPAY_API_URL}/v1/charge`); // 🔹 log da URL

    // Chamada AbacatePay (ajuste singular /v1/charge)
    const response = await axios.post(
      `${process.env.ABACATEPAY_API_URL}/v1/charge`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("🎯 Resposta da AbacatePay:", response.data); // 🔹 log da resposta da API

    res.json(response.data);

  } catch (error) {
    console.error("❌ Erro no checkout AbacatePay:", error.response?.data || error.message);
    res.status(500).json({ error: "Erro ao criar pagamento", details: error.response?.data || error.message });
  }
});

// 📌 Rota de cálculo de frete
app.post("/shipping/calculate", async (req, res) => {
  try {
    const { cep, subtotal } = req.body;

    console.log("📦 Cálculo de frete para CEP:", cep, "Subtotal:", subtotal); // 🔹 log do cálculo de frete

    if (!cep) return res.status(400).json({ error: "CEP obrigatório" });

    let shippingOptions = [
      { id: 1, name: "PAC", price: 2000, estimatedDays: 5 },
      { id: 2, name: "SEDEX", price: 4000, estimatedDays: 2 }
    ];

    if (subtotal >= FREE_SHIPPING_MIN) {
      shippingOptions = shippingOptions.map(opt => ({ ...opt, price: 0 }));
    }

    console.log("🚚 Opções de frete calculadas:", shippingOptions); // 🔹 log das opções de frete

    res.json(shippingOptions);

  } catch (error) {
    console.error("❌ Erro no cálculo de frete:", error);
    res.status(500).json({ error: "Não foi possível calcular o frete", details: error.message });
  }
});

// 📌 Rodar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
