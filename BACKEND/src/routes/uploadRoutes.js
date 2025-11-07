const express = require('express');
const multer = require('multer');
const uploadController = require('../controllers/UploadController');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔹 Campos esperados – alinhados com o frontend
router.post(
  '/',
  upload.fields([
    { name: 'conferencia', maxCount: 1 },
    { name: 'placa', maxCount: 1 },
    { name: 'carga1', maxCount: 1 },
    { name: 'carga2', maxCount: 1 },
    { name: 'canhoto', maxCount: 1 },
  ]),
  uploadController.uploadFiles
);

module.exports = router;
