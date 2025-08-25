// checkoutRouter.js
import express from "express";
import mercadopago from "mercadopago";

const router = express.Router();

// Configuração com access token
const mp = new mercadopago.SDK({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

router.post("/", async (req, res) => {
  try {
    const { customer, items, shipping, paymentMethod } = req.body;

    if (!customer || !items?.length) {
      return res.status(400).json({ error: "Itens e dados do cliente são obrigatórios" });
    }

    const preference = {
      items: items.map(i => ({
        title: i.name,
        quantity: i.quantity,
        unit_price: i.amount,
        currency_id: "BRL",
      })),
      payer: {
        name: customer.name,
        email: customer.email,
        phone: { area_code: customer.phone.slice(0,2), number: customer.phone.slice(2) },
        identification: { type: "CPF", number: customer.cpf },
        address: {
          zip_code: customer.zipCode,
          street_name: customer.address.split(",")[0] || "Rua Teste",
          street_number: customer.address.split(",")[1]?.trim() || "S/N",
          neighborhood: "Bairro",
          city: customer.city,
          federal_unit: customer.state
        }
      },
      shipments: { cost: shipping?.amount || 0, mode: "not_specified" },
      back_urls: {
        success: process.env.API_URL + "/success",
        failure: process.env.API_URL + "/failure",
        pending: process.env.API_URL + "/pending"
      },
      auto_return: "approved"
    };

    const response = await mp.preferences.create(preference);

    res.json({ payment_url: response.body.init_point });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao processar checkout", details: err.message });
  }
});

export default router;
