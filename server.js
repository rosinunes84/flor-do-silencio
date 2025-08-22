require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // obrigatório para Render

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
// Cálculo de frete via Melhor Envio
// ==========================
app.post("/shipping/calculate", async (req, res) => {
  const { zipCode, items } = req.body;

  if (!zipCode || !items?.length) {
    return res.status(400).json({ error: "CEP e itens obrigatórios" });
  }

  try {
    const totalWeight = items.reduce((sum, i) => sum + (i.weight || 1) * (i.quantity || 1), 0);
    const totalLength = Math.max(...items.map(i => i.length || 20));
    const totalHeight = items.reduce((sum, i) => sum + (i.height || 5), 0);
    const totalWidth = items.reduce((sum, i) => sum + (i.width || 15), 0);

    const response = await fetch("https://www.melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`
      },
      body: JSON.stringify({
        from: { postal_code: process.env.SENDER_CEP },
        to: { postal_code: zipCode },
        parcels: [{
          weight: totalWeight,
          length: totalLength,
          height: totalHeight,
          width: totalWidth
        }]
      })
    });

    const data = await response.json();

    // Se der erro de autenticação
    if (data.message && data.message.toLowerCase().includes("unauthenticated")) {
      return res.status(401).json({ error: "Token do Melhor Envio inválido ou expirado", raw: data });
    }

    // Se não vier nenhuma opção de frete
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json({ warning: "Nenhuma opção de frete retornada. Verifique CEP, peso ou token.", raw: data });
    }

    const filtered = data.map(option => ({
      name: option.service.name,
      price: parseFloat(option.price),
      delivery_time: option.deadline
    }));

    res.json(filtered);

  } catch (error) {
    console.error("❌ Erro ao calcular frete:", error);
    res.status(500).json({ error: "Erro interno do servidor", details: error.message });
  }
});

// ==========================
// Criação de ordem no PagSeguro (produção)
// ==========================
app.post("/pagseguro/create_order", async (req, res) => {
  const { items, customer, shipping } = req.body;
  if (!items?.length || !customer) {
    return res.status(400).json({ error: "Itens e dados do cliente obrigatórios" });
  }

  try {
    const formData = new URLSearchParams();

    items.forEach((item, i) => {
      formData.append(`itemId${i + 1}`, item.id);
      formData.append(`itemDescription${i + 1}`, item.name);
      formData.append(`itemAmount${i + 1}`, parseFloat(item.amount).toFixed(2));
      formData.append(`itemQuantity${i + 1}`, item.quantity);
    });

    if (shipping?.cost > 0) {
      formData.append(`itemId${items.length + 1}`, "frete");
      formData.append(`itemDescription${items.length + 1}`, "Frete");
      formData.append(`itemAmount${items.length + 1}`, parseFloat(shipping.cost).toFixed(2));
      formData.append(`itemQuantity${items.length + 1}`, 1);
      formData.append("shippingType", shipping.type || 1);
    }

    formData.append("email", process.env.PAGSEGURO_EMAIL);
    formData.append("token", process.env.PAGSEGURO_TOKEN);
    formData.append("currency", "BRL");
    formData.append("reference", Date.now().toString());
    formData.append("senderName", customer.name);
    formData.append("senderEmail", customer.email);
    formData.append("senderPhone", customer.phone.replace(/\D/g, "").slice(0, 11));
    formData.append("shippingAddressStreet", customer.address.split(",")[0] || "Rua Teste");
    formData.append("shippingAddressNumber", customer.address.split(",")[1]?.trim() || "S/N");
    formData.append("shippingAddressDistrict", customer.address.split(",")[1]?.trim() || "Bairro");
    formData.append("shippingAddressPostalCode", customer.zipCode.replace(/\D/g, ""));
    formData.append("shippingAddressCity", customer.city || "Cidade");
    formData.append("shippingAddressState", customer.state || "UF");
    formData.append("shippingAddressCountry", "BRA");

    const response = await fetch("https://ws.pagseguro.uol.com.br/v2/checkout", {
      method: "POST",
      body: formData.toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    });

    const text = await response.text();
    const checkoutCodeMatch = text.match(/<code>(.*)<\/code>/);
    const checkoutUrl = checkoutCodeMatch
      ? `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=${checkoutCodeMatch[1]}`
      : null;

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
  console.log(`🚀 Server rodando na porta ${PORT}`)
);
