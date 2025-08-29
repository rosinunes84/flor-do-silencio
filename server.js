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
    const { customer, items, shipping, coupon, payment_method } = req.body;

    console.log("✅ Recebido payload do frontend:", req.body);

    if (!items?.length || !customer) {
      return res.status(400).json({ error: "Itens e dados do cliente são obrigatórios" });
    }

    // Ajusta valor do frete se necessário
    let shippingAmount = shipping?.amount || 0;
    const subtotal = items.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
    if (subtotal >= FREE_SHIPPING_MIN) shippingAmount = 0;

    // Ajusta payload para o modelo oficial da AbacatePay
    const payload = {
      frequency: "ONE_TIME",
      methods: [payment_method || "PIX"],
      products: [
        ...items.map(item => ({
          externalId: item.id || item.externalId,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity || 1,
          price: item.price
        })),
        ...(shippingAmount > 0 ? [{
          externalId: `shipping_${Date.now()}`,
          name: "Frete",
          description: "Entrega",
          quantity: 1,
          price: shippingAmount
        }] : [])
      ],
      customerId: customer.id || undefined,
      customer: {
        metadata: {
          name: customer.name,
          cellphone: customer.cellphone,
          email: customer.email,
          taxId: customer.taxId
        }
      },
      allowCoupons: true,
      coupons: coupon ? [coupon] : [],
      externalId: `order_${Date.now()}`,
      returnUrl: process.env.RETURN_URL,
      completionUrl: process.env.COMPLETION_URL
    };

    console.log("🚀 Payload enviado para AbacatePay:", payload);
    console.log("🔗 URL AbacatePay usada:", `${process.env.ABACATEPAY_API_URL}/v1/billing/create`);

    // Chamada AbacatePay (endpoint correto)
    const response = await axios.post(
      `${process.env.ABACATEPAY_API_URL}/v1/billing/create`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("🎯 Resposta da AbacatePay:", response.data);

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

    console.log("📦 Cálculo de frete para CEP:", cep, "Subtotal:", subtotal);

    if (!cep) return res.status(400).json({ error: "CEP obrigatório" });

    let shippingOptions = [
      { id: 1, name: "PAC", price: 20.90, estimatedDays: 5 },
      { id: 2, name: "SEDEX", price: 4000, estimatedDays: 2 }
    ];

    if (subtotal >= FREE_SHIPPING_MIN) {
      shippingOptions = shippingOptions.map(opt => ({ ...opt, price: 0 }));
    }

    console.log("🚚 Opções de frete calculadas:", shippingOptions);

    res.json(shippingOptions);

  } catch (error) {
    console.error("❌ Erro no cálculo de frete:", error);
    res.status(500).json({ error: "Não foi possível calcular o frete", details: error.message });
  }
});

// 📌 Rodar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
