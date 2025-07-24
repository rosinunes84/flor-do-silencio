import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';
import querystring from 'querystring';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Serve frontend estático (build do Vite)
app.use(express.static(path.join(__dirname, 'dist')));

// Utilitário para endereço seguro
function safeBillingAddress(holder) {
  return {
    billingAddressStreet: holder?.billingAddress?.street || '',
    billingAddressNumber: holder?.billingAddress?.number || '',
    billingAddressDistrict: holder?.billingAddress?.district || '',
    billingAddressPostalCode: holder?.billingAddress?.postalCode || '',
    billingAddressCity: holder?.billingAddress?.city || '',
    billingAddressState: holder?.billingAddress?.state || '',
    billingAddressCountry: 'BRA',
  };
}

// API de pagamento
app.post('/api/process-payment', async (req, res) => {
  const {
    token,
    senderHash,
    amount,
    name,
    cpf,
    email,
    phoneAreaCode,
    phoneNumber,
    birthDate,
    installmentQuantity,
    installmentValue,
    creditCardHolder,
  } = req.body;

  try {
    const data = {
      email: process.env.PAGSEGURO_EMAIL,
      token: process.env.PAGSEGURO_TOKEN,
      paymentMode: 'default',
      paymentMethod: 'creditCard',
      receiverEmail: process.env.PAGSEGURO_EMAIL,
      currency: 'BRL',
      itemId1: '001',
      itemDescription1: 'Compra na loja Flor do Silêncio',
      itemAmount1: amount,
      itemQuantity1: 1,
      reference: 'PEDIDO123',
      senderName: name,
      senderCPF: cpf,
      senderAreaCode: phoneAreaCode,
      senderPhone: phoneNumber,
      senderEmail: email,
      senderHash: senderHash,
      shippingAddressRequired: false,
      creditCardToken: token,
      installmentQuantity,
      installmentValue,
      noInterestInstallmentQuantity: 2,
      creditCardHolderName: creditCardHolder.name,
      creditCardHolderCPF: creditCardHolder.cpf,
      creditCardHolderBirthDate: creditCardHolder.birthDate,
      creditCardHolderAreaCode: creditCardHolder.areaCode,
      creditCardHolderPhone: creditCardHolder.phone,
      ...safeBillingAddress(creditCardHolder),
    };

    const postData = querystring.stringify(data);

    const response = await axios.post(
      'https://ws.pagseguro.uol.com.br/v2/transactions',
      postData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    res.status(200).send({ success: true, data: response.data });
  } catch (error) {
    console.error('Erro no pagamento:', error.response?.data || error.message);
    res
      .status(500)
      .send({ success: false, error: error.response?.data || error.message });
  }
});

// Sempre retorna index.html para rotas do frontend (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

// Start do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
