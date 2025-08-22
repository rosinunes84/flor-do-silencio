require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Compatibilidade do fetch (Node >=18 usa global, senão importa node-fetch)
let fetch;
if (typeof globalThis.fetch === "function") {
  fetch = globalThis.fetch;
} else {
  fetch = require("node-fetch");
}

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
// Cálculo de frete (MelhorEnvio) - Retornando apenas PAC e SEDEX
// ==========================
app.post("/shipping/calculate", async (req, res) => {
  const { zipCode, items } = req.body;

  if (!zipCode || !items?.length) {
    return res.status(400).json({ error: "CEP e itens obrigatórios" });
  }

  try {
    const payload = {
      from: { postal_code: process.env.SENDER_CEP },
      to: { postal_code: zipCode },
      products: items.map((item) => ({
        name: item.name || "Produto",
        quantity: item.quantity || 1,
        unitary_value: item.salePrice || 50,
        weight: item.weight || 1,
        length: item.length || 20,
        height: item.height || 5,
        width: item.width || 15,
      })),
      options: {
        insurance_value: items.reduce((sum, i) => sum + (i.salePrice || 0), 0),
      },
    };

    console.log("📦 Calculando frete:", payload);

    const response = await fetch(
      "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: data.message || "Erro ao calcular frete" });
    }

    // Filtrar apenas PAC e SEDEX
    const filtered = data
      .filter(
        (option) =>
          option.name.toUpperCase() === "PAC" ||
          option.name.toUpperCase() === "SEDEX"
      )
      .map((option) => ({
        name: option.name,
        price: parseFloat(option.price || 0),
        delivery_time: option.delivery_time,
        company: option.company?.name || "",
      }));

    res.json(filtered);
  } catch (error) {
    console.error("❌ Erro ao calcular frete:", error);
    res
      .status(500)
      .json({ error: "Erro interno do servidor", details: error.message });
  }
});

// ==========================
// Criação de ordem no PagSeguro (produção)
// ==========================
app.post("/pagseguro/create_order", async (req, res) => {
  const { items, customer, shipping } = req.body;
  if (!items?.length || !customer) {
    return res
      .status(400)
      .json({ error: "Itens e dados do cliente obrigatórios" });
  }

  try {
    const formData = new URLSearchParams();

    items.forEach((item, i) => {
      formData.append(`itemId${i + 1}`, item.id);
      formData.append(`itemDescription${i + 1}`, item.name);
      formData.append(
        `itemAmount${i + 1}`,
        parseFloat(item.amount).toFixed(2)
      );
      formData.append(`itemQuantity${i + 1}`, item.quantity);
    });

    if (shipping?.cost > 0) {
      formData.append(`itemId${items.length + 1}`, "frete");
      formData.append(`itemDescription${items.length + 1}`, "Frete");
      formData.append(
        `itemAmount${items.length + 1}`,
        parseFloat(shipping.cost).toFixed(2)
      );
      formData.append(`itemQuantity${items.length + 1}`, 1);
      formData.append("shippingType", shipping.type || 1);
    }

    formData.append("email", process.env.PAGSEGURO_EMAIL);
    formData.append("token", process.env.PAGSEGURO_TOKEN);
    formData.append("currency", "BRL");
    formData.append("reference", Date.now().toString());
    formData.append("senderName", customer.name);
    formData.append("senderEmail", customer.email);
    formData.append(
      "senderPhone",
      customer.phone.replace(/\D/g, "").slice(0, 11)
    );
    formData.append(
      "shippingAddressStreet",
      customer.address.split(",")[0] || "Rua Teste"
    );
    formData.append(
      "shippingAddressNumber",
      customer.address.split(",")[1]?.trim() || "S/N"
    );
    formData.append(
      "shippingAddressDistrict",
      customer.address.split(",")[1]?.trim() || "Bairro"
    );
    formData.append(
      "shippingAddressPostalCode",
      customer.zipCode.replace(/\D/g, "")
    );
    formData.append("shippingAddressCity", customer.city || "Cidade");
    formData.append("shippingAddressState", customer.state || "UF");
    formData.append("shippingAddressCountry", "BRA");

    const response = await fetch(
      "https://ws.pagseguro.uol.com.br/v2/checkout",
      {
        method: "POST",
        body: formData.toString(),
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded; charset=UTF-8",
        },
      }
    );

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
  console.log(`🚀 Server running on port ${PORT}`)
);
