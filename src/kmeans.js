/**
 * Importa il modulo nodeplotlib per generare grafici.
 */
var nodeplotlib = require('nodeplotlib');

/**
 * Importa il modulo data-forge per la manipolazione dei dati.
 */
var dataForge = require('data-forge');

/**
 * Importa il modulo clusters per il clustering.
 */
var clusterMaker = require('clusters');

/**
 * Importa il modulo data-forge-fs per leggere file con data-forge.
 */
require('data-forge-fs');

/**
 * Funzione principale per l'analisi dei dati musicali.
 *
 * @param {string} pathPCA - Percorso al file CSV contenente le componenti principali.
 * @param {string} pathStandardizzato - Percorso al file CSV contenente il dataset standardizzato.
 * @returns {Array} Un array contenente i cluster, le playlist, il dataset PCA e il dataset completo.
 */
function main(pathPCA, pathStandardizzato) {
    // Legge il file delle componenti principali e lo trasforma in un DataFrame
    let dataFrame = dataForge.readFileSync(pathPCA).parseCSV();

    // Ottiene i nomi delle colonne dal DataFrame
    let columnNames = dataFrame.getColumnNames();
    for (i = 0; i < columnNames.length; i++)
        dataFrame = dataFrame.parseFloats(columnNames[i]);
    let datasetPCA = dataFrame.toRows(); // Converte il DataFrame in array di array

    // Legge il file del dataset standardizzato
    dataFrame = dataForge.readFileSync(pathStandardizzato).parseCSV();
    let datasetCompleto = dataFrame.toArray();


}