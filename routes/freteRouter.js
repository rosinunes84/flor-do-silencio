import express from "express";
import axios from "axios";

const router = express.Router();

// Calcular frete
router.post("/", async (req, res) => {
  try {
    const { cepDestino, peso = 1, altura = 1, largura = 1, comprimento = 1 } = req.body;

    const cepOrigem = "01001-000"; // Altere para o CEP da sua loja

    const url = `http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx?sCepOrigem=${cepOrigem}&sCepDestino=${cepDestino}&nVlPeso=${peso}&nCdFormato=1&nVlComprimento=${comprimento}&nVlAltura=${altura}&nVlLargura=${largura}&sCdServico=04014&nVlDiametro=0&StrRetorno=json`;

    const response = await axios.get(url);
    
    // Retorna apenas o valor e prazo
    const frete = response.data.cServico ? response.data.cServico[0] : null;

    res.json({ frete });
  } catch (error) {
    console.error("Erro ao calcular frete:", error);
    res.status(500).json({ error: "Erro ao calcular frete" });
  }
});

export default router;
