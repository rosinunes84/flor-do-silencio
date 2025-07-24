// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const querystring = require('querystring');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// 🔐 Recomendado: use variáveis de ambiente
const PAGSEGURO_EMAIL = process.env.PAGSEGURO_EMAIL || "contato@flordosilencio.com.br";
const PAGSEGURO_TOKEN = process.env.PAGSEGURO_TOKEN || "9bc6cff2-d963-4b05-bbb3-772697af7654ed455bca4a219ca20be304475dc0bbbfe8d0-6a15-4d42-aa21-8bdb78aa5416";

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

// 🚀 Endpoint de pagamento
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
    creditCardHolder
  } = req.body;

  try {
    const data = {
      email: PAGSEGURO_EMAIL,
      token: PAGSEGURO_TOKEN,
      paymentMode: 'default',
      paymentMethod: 'creditCard',
      receiverEmail: PAGSEGURO_EMAIL,
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

    const response = await axios.post('https://ws.pagseguro.uol.com.br/v2/transactions', postData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    res.status(200).send({ success: true, data: response.data });
  } catch (error) {
    console.error("Erro no pagamento:", error.response?.data || error.message);
    res.status(500).send({ success: false, error: error.response?.data || error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
