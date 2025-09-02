// server.js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Rotas de teste
app.get("/", (req, res) => {
  res.send("API Flor do Silêncio rodando com sucesso 🚀");
});

// Endpoint de cálculo de frete (exemplo simples)
app.post("/shipping/calculate", (req, res) => {
  const { cep, subtotal } = req.body;
  console.log("Calculando frete para:", cep, "Subtotal:", subtotal);

  // Exemplo fixo
  const options = [
    { id: 1, name: "PAC", price: 2090, estimatedDays: 5 }, // preço em centavos
    { id: 2, name: "Sedex", price: 3590, estimatedDays: 2 }
  ];

  return res.json(options);
});

// Endpoint de checkout (ajustado ✅)
app.post("/checkout", async (req, res) => {
  try {
    const { items, customer, shipping, coupon, payment_method, total } = req.body;

    console.log("Payload recebido no backend:", req.body);

    // ✅ Corrigir preços para centavos
    const products = items.map(item => ({
      id: item.id,
      name: item.name,
      price: Math.round(item.price * 100), // conversão necessária
      quantity: item.quantity,
    }));

    const payload = {
      products,
      customer,
      shipping,
      coupon,
      payment_method,
      total: Math.round(total * 100), // total também em centavos
    };

    console.log("Payload ajustado para Abacate Pay:", payload);

    // Simulação da chamada ao Abacate Pay
    // Aqui você colocaria a request real com fetch/axios
    const fakeResponse = {
      status: "success",
      payment_url: "https://abacatepay.com/checkout/12345",
    };

    return res.json(fakeResponse);
  } catch (error) {
    console.error("Erro no backend:", error);
    return res.status(500).json({
      error: "Erro ao criar pagamento",
      details: error,
    });
  }
});

// Inicialização do servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
