const pca = require('./src/pca');
const kmeans = require('./src/kmeans');
const dbscan = require('./src/dbscan');

const pathDataset= pca.pcaProcess('./Dataset/DatasetSpotify2000.csv',0.10); // Array, primo elemento path standardizzato secondo elemento path pc
const pathStandardizzato = pathDataset[0];
const pcaOutputPath = pathDataset[1];
/*
const results = kmeans.mainKMeans(pcaOutputPath, pathStandardizzato);
const clusters = results[0];
const datasetAsArray = results[2];
const allSongsAsArray = results[3];

kmeans.grafico3D(clusters,datasetAsArray,allSongsAsArray);
kmeans.graficoRadar(clusters, datasetAsArray, allSongsAsArray);
kmeans.makeHistograms(clusters, "Danceability", datasetAsArray, allSongsAsArray);
*/
/* DBScan *//*
dbscan.dbscan(pcaOutputPath);*/