const uploadService = require("../services/uploadService");

async function uploadFiles(req, res) {
  try {
    const { documentNumber } = req.body;
    if (!documentNumber) {
      return res.status(400).json({ success: false, message: "documentNumber é obrigatório." });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ success: false, message: "Nenhum arquivo enviado." });
    }

    const result = await uploadService.handleUpload(req.files, documentNumber);
    res.status(200).json({
      success: true,
      message: "Upload concluído com sucesso!",
      data: result,
    });
  } catch (err) {
    console.error("[ERRO UPLOAD]", err);
    res.status(500).json({
      success: false,
      message: err.message || "Erro interno ao processar upload.",
    });
  }
}

module.exports = { uploadFiles };
