const documentoService = require('../services/documentoService');

async function listarDocumentos(req, res) {
  try {
    const { nota = '', data = '' } = req.query || {};

    const filtros = {
      nota: nota || '',
      data: data || '',
    };

    const documentos = await documentoService.listarDocumentos(filtros);

    return res.status(200).json(documentos);
  } catch (err) {
    console.error('[DOCUMENTOS ERROR]', err);

    return res.status(500).json({
      message: 'Erro ao listar documentos. Tente novamente mais tarde.',
    });
  }
}

module.exports = { listarDocumentos };
