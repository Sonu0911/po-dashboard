const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
// cors({ origin: " https://successful-freedom-production-53ce.up.railway.app"
//  })

app.use(cors({
  origin: "https://successful-freedom-production-53ce.up.railway.app"
}));
app.use(express.json());

app.use('/api/pos', require('./routes/pos'));
app.use('/api/summary', require('./routes/summary'));
app.use('/api/upload', upload.single('pdf'), require('./routes/upload'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`server running on  port ${PORT} !`);
});