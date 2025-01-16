const pca = require('./src/pca');
const kmeans = require('./src/kmeans');
const dbscan = require('./src/dbscan');

// Processo PCA
const percorsiDataset = pca.analisiPCA('./Dataset/DatasetSpotify2000.csv', 0.70); // Array con i percorsi: [file standardizzato, file PCA]
const percorsoStandardizzato = percorsiDataset[0];
const percorsoPCA = percorsiDataset[1];

// Processo K-Means
const risultatiKMeans = kmeans.mainKMeans(percorsoPCA, percorsoStandardizzato);
const clustersKMeans = risultatiKMeans[0];
const datasetClusterizzato = risultatiKMeans[2];
const tutteLeCanzoni = risultatiKMeans[3];

// Generazione grafici per K-Means
kmeans.grafico3D(clustersKMeans, datasetClusterizzato, tutteLeCanzoni);
kmeans.graficoRadar(clustersKMeans, datasetClusterizzato, tutteLeCanzoni);
kmeans.makeHistograms(clustersKMeans, "Danceability", datasetClusterizzato, tutteLeCanzoni);

// Processo DBScan
dbscan.dbscan(percorsoPCA);
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




