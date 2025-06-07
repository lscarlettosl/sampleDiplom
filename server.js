const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.static('public')); // отдача файлов
app.use('/uploads', express.static('uploads')); // доступ к загруженным моделям
app.use(express.static(path.join(__dirname, 'public')));

// === Загрузка файлов ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.mimetype.startsWith('image/') ? 'uploads/backgrounds' : 'uploads/models';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s/g, '_');
    cb(null, `${Date.now()}_${name}${ext}`);
  }
});

const upload = multer({ storage });

// Загрузка 3D модели
app.post('/upload-model', upload.single('model'), (req, res) => {
  res.cookie('lastModelPath', `/uploads/models/${req.file.filename}`);
  res.json({ path: `/uploads/models/${req.file.filename}` });
});

// Загрузка HDR/EXR или изображения для скайбокса
app.post('/upload-bg', upload.single('background'), (req, res) => {
  res.cookie('lastBackgroundPath', `/uploads/backgrounds/${req.file.filename}`);
  res.json({ path: `/uploads/backgrounds/${req.file.filename}` });
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
