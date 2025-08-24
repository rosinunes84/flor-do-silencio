const mercadopago = require("mercadopago");

// Configura token de acesso
mercadopago.configurations = { access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN };

const createPayment = async (req, res) => {
  try {
    const { orderId, items, customer, total, shippingCost } = req.body;

    if (!items?.length || !customer) {
      return res.status(400).json({ error: "Itens e dados do cliente são obrigatórios" });
    }

    // Monta preference para Mercado Pago
    const preference = {
      items: items.map((item) => ({
        title: item.name,
        quantity: item.quantity,
        unit_price: item.amount,
      })),
      payer: {
        name: customer.name,
        email: customer.email,
        phone: {
          area_code: customer.phone.substring(0, 2),
          number: customer.phone.substring(2),
        },
        identification: {
          type: "CPF",
          number: customer.cpf,
        },
        address: {
          zip_code: customer.zipCode,
          street_name: customer.address.split(",")[0] || "Rua Teste",
          street_number: customer.address.split(",")[1]?.trim() || "S/N",
          neighborhood: customer.address.split(",")[1]?.trim() || "Bairro",
          city: customer.city || "Cidade",
          federal_unit: customer.state || "UF",
        },
      },
      shipments: {
        cost: shippingCost || 0,
        mode: "not_specified",
        receiver_address: {
          zip_code: customer.zipCode,
          street_name: customer.address.split(",")[0] || "Rua Teste",
          street_number: customer.address.split(",")[1]?.trim() || "S/N",
          neighborhood: customer.address.split(",")[1]?.trim() || "Bairro",
          city: customer.city || "Cidade",
          federal_unit: customer.state || "UF",
        },
      },
      external_reference: orderId || `${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      back_urls: {
        success: process.env.API_URL + "/success",
        failure: process.env.API_URL + "/failure",
        pending: process.env.API_URL + "/pending",
      },
      auto_return: "approved",
    };

    const response = await mercadopago.preferences.create(preference);

    res.json({ payment_url: response.body.init_point });
  } catch (error) {
    console.error("Erro no createPayment Mercado Pago:", error);
    res.status(500).json({ error: "Erro ao criar pagamento", details: error.message });
  }
};

module.exports = { createPayment };
