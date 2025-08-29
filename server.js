import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Validar variáveis de ambiente obrigatórias
const REQUIRED_ENV = ["ABACATEPAY_API_URL", "ABACATEPAY_API_KEY", "RETURN_URL", "COMPLETION_URL"];
for (const envVar of REQUIRED_ENV) {
  if (!process.env[envVar]) {
    console.error(`❌ Variável ${envVar} não definida`);
    process.exit(1);
  }
}

app.post("/checkout", async (req, res) => {
  const { items, customer, payment_method, coupon } = req.body;

  if (!items || !customer) {
    return res.status(400).json({ error: "Itens e cliente são obrigatórios" });
  }

  // Validar método
  const allowedMethods = ["PIX", "CREDIT_CARD", "BOLETO"];
  const method = (payment_method || "PIX").toUpperCase();

  if (!allowedMethods.includes(method)) {
    return res.status(400).json({ error: "Método de pagamento inválido" });
  }

  // Montar payload para AbacatePay
  const payload = {
    frequency: "ONE_TIME",
    methods: [method],
    products: items.map(item => ({
      externalId: item.id || item.externalId,
      name: item.name,
      description: item.description || "",
      quantity: item.quantity || 1,
      price: item.price
    })),
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

  try {
    const response = await fetch(`${process.env.ABACATEPAY_API_URL}/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ABACATEPAY_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Erro ao criar pagamento", details: data });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Erro interno", details: err.message });
  }
});

// Rota de teste
app.get("/", (req, res) => {
  res.send("Servidor ativo 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
