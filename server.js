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

// 📌 Rota de checkout AbacatePay
app.post("/checkout", async (req, res) => {
  try {
    const { customer, items, shipping, coupon, paymentMethod } = req.body;

    if (!items?.length || !customer || !shipping) {
      return res.status(400).json({ error: "Itens, cliente e frete são obrigatórios" });
    }

    // Calcula total
    const totalAmount = items.reduce((acc, i) => acc + i.amount * i.quantity, 0) + (shipping?.amount || 0);

    const payload = {
      customer: {
        name: customer.name,
        email: customer.email,
        cellphone: customer.phone,
        taxId: customer.cpf,
        address: {
          zipCode: customer.zipCode,
          street: customer.address,
          city: customer.city,
          state: customer.state,
        }
      },
      items,
      shipping,
      totalAmount,
      coupon: coupon || null,
      paymentMethod: paymentMethod || "PIX",
    };

    console.log("📦 Payload enviado para AbacatePay:", payload);

    const response = await axios.post(
      "https://api.abacatepay.com/v1/charges",
      payload,
      {
        headers: {
          "Authorization": `Bearer ${process.env.ABACATEPAY_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("📬 Resposta do AbacatePay:", response.data);

    if (response.data?.data?.url) {
      return res.json({ payment_url: response.data.data.url });
    }

    res.status(500).json({ error: "Não foi possível gerar o link de pagamento", details: response.data });

  } catch (err) {
    console.error("Erro no checkout AbacatePay:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro ao criar pagamento", details: err.response?.data || err.message });
  }
});

// 📌 Rota de cálculo de frete
app.post("/shipping/calculate", async (req, res) => {
  try {
    const { cep } = req.body;
    if (!cep) return res.status(400).json({ error: "CEP obrigatório" });

    // Simulação de opções de frete
    const shippingOptions = [
      { id: 1, name: "PAC", price: 2000, estimatedDays: 5 }, // centavos
      { id: 2, name: "SEDEX", price: 4000, estimatedDays: 2 },
    ];

    res.json(shippingOptions);

  } catch (error) {
    console.error("Erro no cálculo de frete:", error.message);
    res.status(500).json({ error: "Não foi possível calcular o frete", details: error.message });
  }
});

// 📌 Rodar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
