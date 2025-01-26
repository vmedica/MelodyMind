const pca = require('./src/pca');
const kmeans = require('./src/kmeans');
const dbscan = require('./src/dbscan');

const pathDataset= pca.pcaProcess('./Dataset/DatasetSpotify2000.csv',0.70); // Ritorna un Array dove il primo elemento path standardizzato secondo elemento path pc
const pathStandardizzato = pathDataset[0];
const pcaOutputPath = pathDataset[1];

/*DBScan*/
dbscan.dbscan(pcaOutputPath);

/*K-means*/
const results = kmeans.mainKMeans(pcaOutputPath, pathStandardizzato);
const clusters = results[0];
const playlists = results[1];
const datasetAsArray = results[2];
const allSongsAsArray = results[3];

kmeans.grafico3D(clusters,datasetAsArray,allSongsAsArray);
kmeans.graficoRadar(clusters, datasetAsArray, allSongsAsArray);


/* Grafico a barre dei valori medi delle features considerate */
kmeans.makeHistograms(clusters, "Beats Per Minute (BPM)", datasetAsArray, allSongsAsArray);
/*
kmeans.makeHistograms(clusters, "Energy", datasetAsArray, allSongsAsArray);
kmeans.makeHistograms(clusters, "Danceability", datasetAsArray, allSongsAsArray);
kmeans.makeHistograms(clusters, "Loudness (dB)", datasetAsArray, allSongsAsArray);
kmeans.makeHistograms(clusters, "Liveness", datasetAsArray, allSongsAsArray);
kmeans.makeHistograms(clusters, "Valence", datasetAsArray, allSongsAsArray);
kmeans.makeHistograms(clusters, "Acousticness", datasetAsArray, allSongsAsArray);
kmeans.makeHistograms(clusters, "Speechiness", datasetAsArray, allSongsAsArray);
*/

kmeans.visualizzaCanzoniNeiCluster(clusters, datasetAsArray, allSongsAsArray);



