import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * Rota para calcular frete pelos Correios.
 * Recebe:
 *  - cepOrigem
 *  - cepDestino
 *  - peso (em kg)
 *  - comprimento, altura, largura, diametro (em cm)
 */
router.post("/", async (req, res) => {
  try {
    const { cepOrigem, cepDestino, peso, comprimento, altura, largura, diametro } = req.body;

    if (!cepOrigem || !cepDestino || !peso) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    // Monta a URL do serviço dos Correios (CalcPrecoPrazo)
    const params = new URLSearchParams({
      nCdEmpresa: process.env.CORREIOS_USER || "",
      sDsSenha: process.env.CORREIOS_PASSWORD || "",
      nCdServico: "41106", // PAC
      sCepOrigem: cepOrigem.replace(/\D/g, ""),
      sCepDestino: cepDestino.replace(/\D/g, ""),
      nVlPeso: peso,
      nCdFormato: "1", // caixa/pacote
      nVlComprimento: comprimento || "20",
      nVlAltura: altura || "10",
      nVlLargura: largura || "15",
      nVlDiametro: diametro || "0",
      sCdMaoPropria: "N",
      nVlValorDeclarado: "0",
      sCdAvisoRecebimento: "N",
      StrRetorno: "xml"
    });

    const response = await axios.get(`http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx?${params.toString()}`);

    // Aqui você pode parsear o XML ou devolver direto
    res.send(response.data);
  } catch (error) {
    console.error("Erro ao calcular frete:", error);
    res.status(500).json({ error: "Erro ao calcular frete" });
  }
});

export default router;
