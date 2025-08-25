import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MercadoPagoConfig, Payment } from "mercadopago";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Configura Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

// Rota única de checkout
app.post("/checkout", async (req, res) => {
  try {
    const { customer, items, shipping, paymentMethod, token, installments, paymentMethodId } = req.body;

    if (!items?.length || !customer) {
      return res.status(400).json({ error: "Itens e dados do cliente são obrigatórios" });
    }

    // Calcula valor total
    const transactionAmount =
      items.reduce((acc, item) => acc + item.amount * item.quantity, 0) + (shipping?.amount || 0);

    const description = items.map(i => i.name).join(", ");

    const body = {
      transaction_amount: Number(transactionAmount),
      description,
      payer: {
        email: customer.email,
        identification: {
          type: "CPF",
          number: customer.cpf,
        },
      },
    };

    if (paymentMethod === "pix") {
      body.payment_method_id = "pix";
    } else if (paymentMethod === "card") {
      if (!token || !paymentMethodId || !installments) {
        return res.status(400).json({ error: "Token, método e parcelas são obrigatórios para cartão" });
      }
      body.token = token;
      body.installments = Number(installments);
      body.payment_method_id = paymentMethodId;
    } else {
      return res.status(400).json({ error: "Método de pagamento inválido" });
    }

    const response = await payment.create({ body });
    res.json(response);
  } catch (error) {
    console.error("Erro no checkout:", error);
    res.status(500).json({ error: "Erro ao criar pagamento", details: error.message });
  }
});

// Rodar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
