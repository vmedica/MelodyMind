/**
 * PCA (Principal Component Analysis)
 * Effettua il preprocessing del dataset Spotify eseguendo la PCA.
 *
 * @module pca
 */
const pca = require('./src/pca');

/**
 * K-means clustering
 * Implementa il clustering delle canzoni nel dataset usando l'algoritmo kmeans.
 *
 * @module kmeans
 */
const kmeans = require('./src/kmeans');

/**
 * DBScan clustering
 * Implementa il clustering delle canzoni utilizzando l'algoritmo DBScan.
 *
 * @module dbscan
 */
const dbscan = require('./src/dbscan');

// Path del dataset Spotify
const datasetPath = './Dataset/DatasetSpotify2000.csv';

/**
 * Effettua il preprocessing del dataset usando PCA.
 *
 * @param {string} datasetPath - Il path del dataset originale.
 * @param {number} varianceThreshold - Soglia della varianza per selezionare i componenti principali.
 * @returns {Array<string>} Array contenente:
 *                          - Path del dataset standardizzato
 *                          - Path del dataset ridotto tramite PCA
 */
const pathDataset = pca.pcaProcess(datasetPath, 0.70);
const pathStandardizzato = pathDataset[0];
const pcaOutputPath = pathDataset[1];

/**
 * Esegue l'algoritmo DBScan sul dataset ridotto tramite PCA.
 *
 * @param {string} pcaOutputPath - Path del dataset ridotto tramite PCA.
 */
dbscan.dbscan(pcaOutputPath);

/**
 * Esegue l'algoritmo K-means e restituisce i risultati principali.
 *
 * @param {string} pcaOutputPath - Path del dataset ridotto tramite PCA.
 * @param {string} pathStandardizzato - Path del dataset standardizzato.
 * @returns {Array} Un array contenente:
 *                  - clusters: Cluster delle canzoni.
 *                  - datasetAsArray: Array del dataset.
 *                  - allSongsAsArray: Array con tutte le canzoni.
 */
const results = kmeans.mainKMeans(pcaOutputPath, pathStandardizzato);
const clusters = results[0];
const datasetAsArray = results[2];
const allSongsAsArray = results[3];

/**
 * Genera un grafico 3D dei cluster trovati con K-means.
 *
 * @param {Array} clusters - Cluster delle canzoni.
 * @param {Array} datasetAsArray - Dataset come array.
 * @param {Array} allSongsAsArray - Array con tutte le canzoni.
 */
kmeans.grafico3D(clusters, datasetAsArray, allSongsAsArray);

/**
 * Genera un grafico radar per visualizzare le caratteristiche medie dei cluster.
 *
 * @param {Array} clusters - Cluster delle canzoni.
 * @param {Array} datasetAsArray - Dataset come array.
 * @param {Array} allSongsAsArray - Array con tutte le canzoni.
 */
kmeans.graficoRadar(clusters, datasetAsArray, allSongsAsArray);

/**
 * Genera istogrammi per visualizzare i valori medi di una feature all'interno dei cluster.
 *
 * @param {Array} clusters - Cluster delle canzoni.
 * @param {string} feature - Nome della feature da visualizzare (es. "Beats Per Minute (BPM)").
 * @param {Array} datasetAsArray - Dataset come array.
 * @param {Array} allSongsAsArray - Array con tutte le canzoni.
 */
kmeans.makeHistograms(clusters, "Beats Per Minute (BPM)", datasetAsArray, allSongsAsArray);
// kmeans.makeHistograms(clusters, "Energy", datasetAsArray, allSongsAsArray);
// kmeans.makeHistograms(clusters, "Danceability", datasetAsArray, allSongsAsArray);
// kmeans.makeHistograms(clusters, "Loudness (dB)", datasetAsArray, allSongsAsArray);
// kmeans.makeHistograms(clusters, "Liveness", datasetAsArray, allSongsAsArray);
// kmeans.makeHistograms(clusters, "Valence", datasetAsArray, allSongsAsArray);
// kmeans.makeHistograms(clusters, "Acousticness", datasetAsArray, allSongsAsArray);
// kmeans.makeHistograms(clusters, "Speechiness", datasetAsArray, allSongsAsArray);

/**
 * Visualizza un elenco con i dettagli delle canzoni appartenenti a ciascun cluster.
 *
 * @param {Array} clusters - Cluster delle canzoni.
 * @param {Array} datasetAsArray - Dataset come array.
 * @param {Array} allSongsAsArray - Array con tutte le canzoni.
 */
kmeans.visualizzaCanzoniNeiCluster(clusters, datasetAsArray, allSongsAsArray);
