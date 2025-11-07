const uploadService = require("../services/uploadService");

/**
 * Controller responsável por receber o upload e retornar o resultado.
 * Inclui tratamento robusto de erros e logs para diagnóstico.
 */
async function uploadFiles(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "Nenhum arquivo enviado." });
    }

    const result = await uploadService.handleUpload(req.files, req.body);

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
