import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";

dotenv.config();
const app = express();

// ⚡ CORS ajustado para frontend
app.use(cors({
  origin: [
    "https://flor-do-silencio.web.app", // frontend oficial
    "http://localhost:5173",             // ambiente dev
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

// 📌 Rota de checkout para AbacatePay
app.post("/checkout", async (req, res) => {
  try {
    const { customer, items, shipping, coupon, totalAmount, paymentMethod, card } = req.body;

    if (!customer || !items || !items.length) {
      return res.status(400).json({ error: "Itens e dados do cliente são obrigatórios" });
    }

    // Monta payload para AbacatePay
    const payload = {
      customer,
      items,
      shipping,
      coupon,
      totalAmount,
      paymentMethod,
      card,
      devMode: true
    };

    const response = await axios.post(
      "https://api.abacatepay.com/v1/charge",
      payload,
      { headers: { "Authorization": `Bearer ${process.env.ABACATEPAY_TOKEN}` } }
    );

    res.json(response.data);

  } catch (error) {
    console.error("Erro no checkout:", error.response?.data || error.message);
    res.status(500).json({ error: "Erro ao criar pagamento", details: error.response?.data || error.message });
  }
});

// 📌 Rota de cálculo de frete
app.post("/shipping/calculate", async (req, res) => {
  try {
    const { cep } = req.body;
    if (!cep || typeof cep !== "string") {
      return res.status(400).json({ error: "CEP obrigatório e deve ser string" });
    }

    // Simulação de opções de frete
    const shippingOptions = [
      { id: 1, name: "PAC", price: 2000, estimatedDays: 5 },   // valores em centavos
      { id: 2, name: "SEDEX", price: 4000, estimatedDays: 2 },
    ];

    // Exemplo de frete grátis se subtotal >= 130 reais
    if (req.body.subtotal >= 13000) {
      shippingOptions.unshift({ id: "free", name: "Frete Grátis", price: 0, estimatedDays: 5 });
    }

    res.json(shippingOptions);

  } catch (error) {
    console.error("Erro no cálculo de frete:", error);
    res.status(500).json({ error: "Não foi possível calcular o frete", details: error.message });
  }
});

// 📌 Rodar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
