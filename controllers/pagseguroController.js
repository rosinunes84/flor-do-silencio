const axios = require('axios');

const createPayment = async (req, res) => {
  try {
    const { orderId, items, customer, total, shippingCost } = req.body;
    const email = process.env.PAGSEGURO_EMAIL;
    const token = process.env.PAGSEGURO_TOKEN;

    // Montando itens para o PagSeguro
    const itemsPayload = items.map((item, index) => ({
      itemId: item.id,
      itemDescription: item.name,
      itemAmount: (item.salePrice).toFixed(2),
      itemQuantity: item.quantity
    }));

    // Adicionando o frete como um item separado
    if (shippingCost && shippingCost > 0) {
      itemsPayload.push({
        itemId: `frete-${orderId}`,
        itemDescription: 'Frete',
        itemAmount: shippingCost.toFixed(2),
        itemQuantity: 1
      });
    }

    // Montar payload do PagSeguro
    const payload = {
      email,
      token,
      currency: 'BRL',
      reference: orderId.toString(),
      senderName: customer.name,
      senderEmail: customer.email,
      senderPhone: customer.phone.replace(/\D/g, ''), // só números
      shippingAddressStreet: customer.address,
      shippingAddressNumber: 'S/N',
      shippingAddressDistrict: customer.address.split(',')[1] || 'Bairro',
      shippingAddressPostalCode: customer.zipCode.replace(/\D/g, ''),
      shippingAddressCity: customer.city || 'Cidade',
      shippingAddressState: customer.state || 'UF',
      shippingAddressCountry: 'BRA',
      items: itemsPayload
    };

    // Converter itens para formato do PagSeguro
    const formData = new URLSearchParams();
    itemsPayload.forEach((item, index) => {
      formData.append(`itemId${index + 1}`, item.itemId);
      formData.append(`itemDescription${index + 1}`, item.itemDescription);
      formData.append(`itemAmount${index + 1}`, item.itemAmount);
      formData.append(`itemQuantity${index + 1}`, item.itemQuantity);
    });
    formData.append('email', email);
    formData.append('token', token);
    formData.append('currency', 'BRL');
    formData.append('reference', orderId);

    formData.append('senderName', customer.name);
    formData.append('senderEmail', customer.email);
    formData.append('senderPhone', customer.phone.replace(/\D/g, ''));
    formData.append('shippingAddressStreet', customer.address);
    formData.append('shippingAddressNumber', 'S/N');
    formData.append('shippingAddressDistrict', customer.address.split(',')[1] || 'Bairro');
    formData.append('shippingAddressPostalCode', customer.zipCode.replace(/\D/g, ''));
    formData.append('shippingAddressCity', customer.city || 'Cidade');
    formData.append('shippingAddressState', customer.state || 'UF');
    formData.append('shippingAddressCountry', 'BRA');

    // Enviar para PagSeguro (sandbox)
    const response = await axios.post(
      'https://ws.pagseguro.uol.com.br/v2/checkout',
      formData.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // Extrair checkout URL
    const checkoutCodeMatch = response.data.match(/<code>(.*)<\/code>/);
    const checkoutUrl = checkoutCodeMatch
      ? `https://sandbox.pagseguro.uol.com.br/v2/checkout/payment.html?code=${checkoutCodeMatch[1]}`
      : null;

    res.json({ checkoutUrl });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao criar pagamento' });
  }
};

module.exports = { createPayment };
