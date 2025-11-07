const multer = require('multer');
const fs = require('fs');
const path = require('path');

const BASE_PATH = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = '';
    switch (file.fieldname) {
      case 'conferencia':
        folder = 'conferencia';
        break;
      case 'placa':
      case 'carga1':
      case 'carga2':
        folder = 'carga';
        break;
      case 'canhoto':
        folder = 'canhoto';
        break;
      default:
        return cb(new Error(`Campo de upload inválido: ${file.fieldname}`));
    }

    const dir = path.join(BASE_PATH, folder);
    fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
  },

  filename: (req, file, cb) => {
    const docNum = req.body.documentNumber;
    if (!docNum) return cb(new Error('documentNumber ausente.'));
    const safeDoc = docNum.replace(/[^\d-]/g, '');
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${safeDoc}_${file.fieldname}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Apenas imagens são permitidas.'));
    }
    cb(null, true);
  },
});

module.exports = upload;
