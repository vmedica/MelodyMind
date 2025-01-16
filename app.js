const pca = require('./src/pca');
const pathDtaset = pca.pcaWork('./Dataset/DatasetSpotify2000.csv', 0.70);

/*

const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Ciao, mondo!');
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server in ascolto sulla porta ${port}`);
    console.log('Client al link: http://localhost:3000/');
});
*/




