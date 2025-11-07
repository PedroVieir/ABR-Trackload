const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const uploadRoutes = require('./src/routes/uploadRoutes');
const documentoRoutes = require('./src/routes/documentoRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/upload', uploadRoutes);
app.use('/api/documentos', documentoRoutes);

app.get('/', (req, res) => res.send('✅ API rodando com sucesso'));

module.exports = app;
