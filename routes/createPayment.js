const mercadopago = require("mercadopago");

// Configura o Access Token
mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

const createPayment = async (req, res) => {
  try {
    const { transaction_amount, token, description, installments, payer } = req.body;

    const payment_data = {
      transaction_amount,
      token,
      description,
      installments,
      payer
    };

    const payment = await mercadopago.payment.create(payment_data);
    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
};

module.exports = { createPayment };
