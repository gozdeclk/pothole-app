const express = require('express');
const app = express();
const port = 3000; // Port numarasını istediğiniz gibi değiştirebilirsiniz

// Basit bir GET endpoint'i
app.get('/', (req, res) => {
  res.send('Merhaba, backend çalışıyor!');
});

// Sunucuyu başlatma
app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});
