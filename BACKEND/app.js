const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Importa controladores e rotas
const uploadController = require('../BACKEND/src/controllers/UploadController');
const documentoRoutes = require('../BACKEND/src/routes/documentoRoutes');

const app = express();

// Configuração do Multer (armazenamento em memória, ideal para o Sharp)
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================
// 🔹 ROTA DE UPLOAD
// ========================
app.post('/api/upload', upload.any(), uploadController.uploadFiles);

// ========================
// 🔹 OUTRAS ROTAS
// ========================
app.use('/api/documentos', documentoRoutes);

// ========================
// 🔹 TESTE DE STATUS
// ========================
app.get('/', (req, res) => {
  res.send('✅ API rodando com sucesso');
});

module.exports = app;
