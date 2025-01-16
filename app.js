const pca = require('./src/pca');
const kmeans = require('./src/kmeans');
const dbscan = require('./src/dbscan');

const pathDataset= pca.pcaProcess('./Dataset/DatasetSpotify2000.csv',0.70); // Array, primo elemento path standardizzato secondo elemento path pc
const pathStandardizzato = pathDataset[0];
const pathPC = pathDataset[1];
