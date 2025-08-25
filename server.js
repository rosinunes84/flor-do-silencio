import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MercadoPagoConfig, Payment } from "mercadopago";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Config Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

// 📌 Criar pagamento PIX
app.post("/checkout/pix", async (req, res) => {
  try {
    const { transactionAmount, description, email, cpf } = req.body;

    const body = {
      transaction_amount: Number(transactionAmount),
      description,
      payment_method_id: "pix",
      payer: {
        email,
        identification: {
          type: "CPF",
          number: cpf,
        },
      },
    };

    const response = await payment.create({ body });
    res.json(response);
  } catch (error) {
    console.error("Erro PIX:", error);
    res.status(500).json({ error: "Erro ao criar pagamento PIX", details: error.message });
  }
});

// 📌 Criar pagamento Cartão de Crédito
app.post("/checkout/card", async (req, res) => {
  try {
    const { transactionAmount, token, description, installments, paymentMethodId, email, cpf } = req.body;

    const body = {
      transaction_amount: Number(transactionAmount),
      token, // token do cartão vindo do front
      description,
      installments: Number(installments),
      payment_method_id: paymentMethodId, // ex: "visa"
      payer: {
        email,
        identification: {
          type: "CPF",
          number: cpf,
        },
      },
    };

    const response = await payment.create({ body });
    res.json(response);
  } catch (error) {
    console.error("Erro Cartão:", error);
    res.status(500).json({ error: "Erro ao criar pagamento Cartão", details: error.message });
  }
});

// 📌 Rodar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
