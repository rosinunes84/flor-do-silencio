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
    const { customer, items, coupon, payment_method } = req.body;

    if (!items?.length || !customer) {
      return res.status(400).json({ error: "Itens e dados do cliente são obrigatórios" });
    }

    // 🔹 Validação de variáveis de ambiente obrigatórias
    const REQUIRED_ENV = ["ABACATEPAY_API_URL", "ABACATEPAY_API_KEY", "RETURN_URL", "COMPLETION_URL"];
    for (const envVar of REQUIRED_ENV) {
      if (!process.env[envVar]) {
        return res.status(500).json({ error: `Variável ${envVar} não definida` });
      }
    }

    const abacateUrl = process.env.ABACATEPAY_API_URL;

    // 🔹 Validação de método de pagamento
    const allowedMethods = ["PIX", "CREDIT_CARD", "BOLETO"];
    const method = (payment_method || "PIX").toUpperCase();
    if (!allowedMethods.includes(method)) {
      return res.status(400).json({ error: `Método de pagamento inválido. Permitidos: ${allowedMethods.join(", ")}` });
    }

    // 🔹 Payload para AbacatePay
    const payload = {
      frequency: "ONE_TIME",
      methods: [method],
      products: items.map(item => ({
        externalId: item.id || item.externalId,
        name: item.name,
        description: item.description || "",
        quantity: item.quantity || 1,
        // 🔹 Garante que price seja inteiro em centavos
        price: Math.round(
          (item.price ?? 0) * (item.price < 1000 ? 100 : 1)
        )
      })),
      customerId: customer.id || undefined,
      customer: {
        name: customer.name,
        cellphone: customer.cellphone,
        email: customer.email,
        taxId: customer.taxId
      },
      allowCoupons: true,
      coupons: coupon ? [coupon] : [],
      externalId: `order_${Date.now()}`,
      returnUrl: process.env.RETURN_URL,
      completionUrl: process.env.COMPLETION_URL
    };

    // 🔹 Chamada AbacatePay
    const response = await axios.post(
      `${abacateUrl}/v1/billing/create`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

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

    if (!cep) return res.status(400).json({ error: "CEP obrigatório" });

    let shippingOptions = [
      { id: 1, name: "PAC", price: 20, estimatedDays: 5 },
      { id: 2, name: "SEDEX", price: 4000, estimatedDays: 2 }
    ];

    if (subtotal >= FREE_SHIPPING_MIN) {
      shippingOptions = shippingOptions.map(opt => ({ ...opt, price: 0 }));
    }

    res.json(shippingOptions);

  } catch (error) {
    console.error("❌ Erro no cálculo de frete:", error);
    res.status(500).json({ error: "Não foi possível calcular o frete", details: error.message });
  }
});

// 📌 Rodar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
