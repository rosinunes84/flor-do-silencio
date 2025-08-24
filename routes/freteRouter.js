import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { cep_origem, cep_destino, peso, comprimento, altura, largura, diametro } = req.body;

    const url = "http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx";
    const params = {
      nCdEmpresa: "",
      sDsSenha: "",
      sCepOrigem: cep_origem,
      sCepDestino: cep_destino,
      nVlPeso: peso,
      nCdFormato: 1,
      nVlComprimento: comprimento,
      nVlAltura: altura,
      nVlLargura: largura,
      nVlDiametro: diametro || 0,
      sCdMaoPropria: "N",
      nVlValorDeclarado: 0,
      sCdAvisoRecebimento: "N",
      StrRetorno: "xml",
      nCdServico: "40010", // Sedex
    };

    const response = await axios.get(url, { params });
    res.send(response.data);
  } catch (error) {
    console.error("Erro no cálculo de frete:", error);
    res.status(500).json({ error: "Erro ao calcular frete" });
  }
});

export default router;
