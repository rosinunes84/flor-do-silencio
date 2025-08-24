require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // Certifique-se de instalar node-fetch v2

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ==========================
// Status do servidor
// ==========================
app.get("/status", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend rodando 🚀",
    timestamp: new Date().toISOString(),
  });
});

// ==========================
// Cálculo de frete simulado
// ==========================
app.post("/shipping/calculate", async (req, res) => {
  const { zipCode, items } = req.body;

  if (!zipCode || !items?.length) {
    return res.status(400).json({ error: "CEP e itens obrigatórios" });
  }

  try {
    const simulatedShipping = {
      name: "Sedex Simulado",
      price: 22.90,
      delivery_time: 5,
    };

    res.json([simulatedShipping]);
  } catch (error) {
    console.error("❌ Erro ao calcular frete:", error);
    res.status(500).json({ error: "Erro interno do servidor", details: error.message });
  }
});

// ==========================
// Criação de ordem no PagSeguro
// ==========================
app.post("/pagseguro/create_order", async (req, res) => {
  const { items, customer, shipping } = req.body;
  if (!items?.length || !customer) {
    return res.status(400).json({ error: "Itens e dados do cliente obrigatórios" });
  }

  try {
    const formData = new URLSearchParams();

    // Itens do pedido
    items.forEach((item, i) => {
      formData.append(`itemId${i + 1}`, item.id);
      formData.append(`itemDescription${i + 1}`, item.name);
      // Garantir que amount está no formato correto (com ponto decimal)
      formData.append(`itemAmount${i + 1}`, parseFloat(item.amount).toFixed(2));
      formData.append(`itemQuantity${i + 1}`, item.quantity);
    });

    // Adicionar frete se houver
    if (shipping?.cost > 0) {
      formData.append(`itemId${items.length + 1}`, "frete");
      formData.append(`itemDescription${items.length + 1}`, "Frete");
      formData.append(`itemAmount${items.length + 1}`, parseFloat(shipping.cost).toFixed(2));
      formData.append(`itemQuantity${items.length + 1}`, 1);
      formData.append("shippingType", shipping.type || 1);
    }

    // Dados do vendedor e moeda
    formData.append("email", process.env.PAGSEGURO_EMAIL);
    formData.append("token", process.env.PAGSEGURO_TOKEN);
    formData.append("currency", "BRL");
    formData.append("reference", Date.now().toString()); // referência única

    // Dados do cliente
    const safePhone = customer.phone.replace(/\D/g, "").slice(0, 11);
    const safeZip = customer.zipCode.replace(/\D/g, "");
    const addressParts = (customer.address || "Rua Teste, S/N").split(",");
    const street = addressParts[0] || "Rua Teste";
    const number = addressParts[1]?.trim() || "S/N";
    const district = addressParts[1]?.trim() || "Bairro";

    formData.append("senderName", customer.name);
    formData.append("senderEmail", customer.email);
    formData.append("senderPhone", safePhone);
    formData.append("shippingAddressStreet", street);
    formData.append("shippingAddressNumber", number);
    formData.append("shippingAddressDistrict", district);
    formData.append("shippingAddressPostalCode", safeZip);
    formData.append("shippingAddressCity", customer.city || "Cidade");
    formData.append("shippingAddressState", customer.state || "UF");
    formData.append("shippingAddressCountry", "BRA");

    // Chamada ao PagSeguro
    const response = await fetch("https://ws.pagseguro.uol.com.br/v2/checkout", {
      method: "POST",
      body: formData.toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    });

    const text = await response.text();

    // ✅ Verifica se o XML contém <code>
    const checkoutCodeMatch = text.match(/<code>(.*)<\/code>/);
    if (!checkoutCodeMatch) {
      console.error("❌ XML retornado pelo PagSeguro:", text);
      return res.status(500).json({
        error: "Checkout inválido do PagSeguro",
        details: "Não foi possível gerar checkout code"
      });
    }

    const checkoutUrl = `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=${checkoutCodeMatch[1]}`;

    res.json({ payment_url: checkoutUrl });
  } catch (error) {
    console.error("❌ Erro PagSeguro:", error);
    res.status(500).json({
      error: "Erro ao criar pedido no PagSeguro",
      details: error.message,
    });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
