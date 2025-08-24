import express from "express";
import mercadopago from "mercadopago";

const router = express.Router();

// Verifica se o token está definido
if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  console.error("❌ MERCADO_PAGO_ACCESS_TOKEN não definido no .env ou no ambiente do Render!");
  process.exit(1);
}

// Configura Mercado Pago
mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

router.post("/create_preference", async (req, res) => {
  try {
    let items = [];

    // Suporta tanto o formato simplificado quanto o array de items
    if (req.body.items && Array.isArray(req.body.items)) {
      items = req.body.items.map(item => ({
        title: item.title,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        currency_id: item.currency_id || "BRL"
      }));
    } else if (req.body.title && req.body.price && req.body.quantity) {
      items = [{
        title: req.body.title,
        quantity: Number(req.body.quantity),
        unit_price: Number(req.body.price),
        currency_id: "BRL"
      }];
    } else {
      return res.status(400).json({ error: "Dados inválidos. Envie 'items' ou 'title', 'price', 'quantity'" });
    }

    const preference = {
      items,
      back_urls: {
        success: "https://seusite.com/success",
        failure: "https://seusite.com/failure",
        pending: "https://seusite.com/pending"
      },
      auto_return: "approved"
    };

    const response = await mercadopago.preferences.create(preference);

    res.json({
      init_point: response.body.init_point,
      id: response.body.id
    });
  } catch (error) {
    console.error("Erro Mercado Pago:", error.response || error);
    res.status(500).json({ error: "Erro ao criar preferência" });
  }
});

export default router;
