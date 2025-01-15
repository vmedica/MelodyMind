const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Ciao, mondo!');
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server in ascolto sulla porta ${port}`);
});