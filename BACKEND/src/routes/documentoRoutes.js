const express = require('express');
const DocumentoController = require('../controllers/DocumentoController');

const router = express.Router();

// GET /api/documentos?nota=XX-XXXXXX&data=YYYY-MM-DD
router.get('/', DocumentoController.listarDocumentos);

module.exports = router;
