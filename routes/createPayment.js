const axios = require('axios');
const mercadopago = require('mercadopago');

// Configura token do Mercado Pago (v2.8.0)
mercadopago.configurations = { access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN };

const createPayment = async (req, res) => {
  try {
    const { orderId, items, customer, total, shippingCost } = req.body;

    if (!items?.length || !customer) {
      return res.status(400).json({ error: "Itens e dados do cliente são obrigatórios" });
    }

    // Monta preference
    const preference = {
      items: items.map((item) => ({
        title: item.name,
        quantity: item.quantity,
        currency_id: 'BRL',
        unit_price: item.amount,
      })),
      payer: {
        name: customer.name,
        email: customer.email,
        identification: {
          type: "CPF",
          number: customer.cpf,
        },
        phone: {
          area_code: customer.phone.substring(0, 2),
          number: customer.phone.substring(2),
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
      payment_methods: {
        installments: 1,
        excluded_payment_types: [],
      },
      external_reference: orderId,
      back_urls: {
        success: process.env.API_URL + "/success",
        failure: process.env.API_URL + "/failure",
        pending: process.env.API_URL + "/pending",
      },
      auto_return: "approved",
    };

    // Cria preferência (v2.8.0 usa callback)
    mercadopago.preferences.create(preference, (error, response) => {
      if (error) {
        console.error("Erro ao criar pagamento:", error);
        return res.status(500).json({ error: "Erro ao criar pagamento", details: error.message });
      }
      res.json({ checkoutUrl: response.response.init_point });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar pagamento', details: error.message });
  }
};

module.exports = { createPayment };
