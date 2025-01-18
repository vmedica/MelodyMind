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

/**
 * Calcola il "punto di gomito" per determinare il numero ottimale di cluster
 * utilizzando il metodo del "squared sum estimate" (SSE)
 *
 * @param {Array} dataset - Il dataset su cui eseguire il clustering.
 * @param {number} min - Il valore minimo di k (numero di cluster).
 * @param {number} max - Il valore massimo di k (numero di cluster).
 * @returns {number} Il valore di k che rappresenta il punto di gomito.
 */

function elbowPoint(dataset, min, max) {
    let kmin = min; // Valore minimo di k.
    let kmax = max; // Valore massimo di k.
    let sse = []; // Array per memorizzare i valori di SSE per ogni k.

    // Calcolo l'SSE per ogni valore di k nel range [kmin, kmax].
    for (let k = kmin; k <= kmax; k++) {
        clusterMaker.k(k); // Imposta il numero di cluster.
        clusterMaker.iterations(100); // Imposta il numero massimo di iterazioni per il clustering.
        clusterMaker.data(dataset); // Fornisce il dataset al cluster maker.
        let cluster = clusterMaker.clusters(); // Esegue il clustering e restituisce i cluster.

        let distortions = 0; // Variabile per calcolare la somma delle distanze.
        for (let i = 0; i < k; i++) {
            distortions += sommaDistanze(cluster[i].centroid, cluster[i].points); // Somma delle distanze tra punti e centroidi.
        }
        sse.push(distortions); // Aggiunge l'SSE calcolato all'array.
    }

    // Calcolo il punto di gomito analizzando le variazioni di SSE tra valori consecutivi di k.
    let deltas = []; // Array per memorizzare i cambiamenti tra valori di SSE consecutivi.
    for (let i = 1; i < sse.length - 1; i++) {
        let delta1 = Math.abs(sse[i] - sse[i - 1]); // Cambiamento tra SSE[i] e SSE[i-1].
        let delta2 = Math.abs(sse[i + 1] - sse[i]); // Cambiamento tra SSE[i+1] e SSE[i].
        deltas.push(Math.abs(delta2 - delta1)); // Differenza assoluta tra i cambiamenti.
    }

    // Trova il massimo cambiamento tra i delta, che rappresenta il punto di gomito.
    const maximumDelta = Math.max(...deltas);
    const elbowPoint = deltas.indexOf(maximumDelta) + 1 + kmin; // Calcola il valore ottimale di k.

    // Genera un array con i valori di k per cui è stato calcolato l'SSE.
    let cordinateX = [];
    for (let k = 0; k < kmax - kmin + 1; k++) {
        cordinateX[k] = kmin + k;
    }

    // Generazione del grafico per visualizzare l'andamento dell'SSE rispetto al numero di cluster.
    let trace1 = {
        x: cordinateX, // Numero di cluster (asse x).
        y: sse, // SSE calcolato per ogni cluster (asse y).
        type: 'scatter' // Tipo di grafico: scatter plot.
    };
    let data = [trace1]; // Dati del grafico.
    let layout = {
        title: 'Elbow Point', // Titolo del grafico.
        xaxis: {
            title: 'Number of Clusters' // Etichetta per l'asse x.
        },
        yaxis: {
            title: 'SSE' // Etichetta per l'asse y.
        }
    };

    nodeplotlib.plot(data, layout); // Mostra il grafico utilizzando nodeplotlib.

    return elbowPoint; // Restituisce il valore di k corrispondente al punto di gomito.
}

