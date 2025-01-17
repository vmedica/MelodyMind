const dbscan = require('@cdxoo/dbscan'); // Algoritmo DBSCAN per clustering
var nodeplotlib = require('nodeplotlib'); // Libreria per generare grafici
var dataForge = require('data-forge'); // Libreria per manipolazione di dataset
require('data-forge-fs'); // Estensione per leggere file CSV con data-forge

const minPoints = 10; // Numero minimo di punti richiesti per formare un cluster


/**
 * Funzione principale che esegue l'algoritmo DBSCAN su un dataset fornito
 * @param {string} pcaOutputPath - Percorso del file CSV contenente i dati delle componenti principali
 */
function main(pcaOutputPath){
    //Manipolazione del dataset
    let dataFrame = dataForge.readFileSync(pcaOutputPath).parseCSV(); // Lettura del file CSV come DataFrame
    dataFrame = dataFrame.parseFloats("PC1"); // Parsing della colonna PC1 come float
    dataFrame = dataFrame.parseFloats("PC2");
    dataFrame = dataFrame.parseFloats("PC3");

    let arrayArray = dataFrame.toRows(); // Conversione del DataFrame in array di array (righe come array)

    console.log("Dataset:", arrayArray);


    // Inizializzazione di array per memorizzare risultati intermedi
    arrayEpsilon = []; // Valori di epsilon testati
    arrayNumeroElementiPrimoCluster = []; // Dimensione del cluster più grande per ogni epsilon
    arrayNumeroElementiNoise = []; // Numero di elementi noise per ogni epsilon
    arrayNumeroCluster = []; // Numero di cluster per ogni epsilon
    deltas = []; // Differenza tra elementi nel cluster più grande e noise

    // Loop per esplorare diversi valori di epsilon
    /*
    Il "loop per esplorare diversi valori di epsilon" indica che il programma sta
    iterando su una gamma di valori per il parametro epsilon, che è un parametro
    fondamentale nell'algoritmo DBSCAN.

    Questo parametro definisce il raggio massimo di vicinanza entro cui
    due punti possono essere considerati "vicini" nello spazio delle
    caratteristiche.

    Il ciclo parte da epsilon = 0.36 e termina quando epsilon > 0.7, aumentando di 0.03 a ogni iterazione.
    Per ogni valore di epsilon:
    Viene eseguito il clustering con il valore corrente di epsilon.
    I risultati del clustering (numero di cluster, noise, ecc.) vengono analizzati e memorizzati.
    Alla fine del ciclo, i dati raccolti sono usati per determinare quale valore di epsilon produce risultati migliori secondo un criterio (es. minimizzazione del delta).
     */
    for (e = 0.36; e <= 0.7; e += 0.03) {
        console.log("E: " + e);
        arrayEpsilon.push(e);

        // Applicazione del clustering con il valore corrente di epsilon
        const result = makeCluster(arrayArray, e, minPoints);
        console.log("Numero cluster: " + result.clusters.length);
        console.log("Noise: " + result.noise.length);

        // Trova il cluster più grande e calcola la sua dimensione
        indexOfBiggest = findIndexOfBiggestArray(result.clusters);
        lengthOfBiggest = result.clusters[indexOfBiggest] ? result.clusters[indexOfBiggest].length : 0;
        lengthOfNoise = result.noise ? result.noise.length : 0;

        // Memorizza i risultati intermedi
        arrayNumeroElementiPrimoCluster.push(lengthOfBiggest);
        arrayNumeroElementiNoise.push(lengthOfNoise);
        arrayNumeroCluster.push(result.clusters ? result.clusters.length : 0);

        // Calcola la differenza tra il cluster più grande e i punti noise
        delta = Math.abs(lengthOfBiggest - lengthOfNoise);
        deltas.push([delta, e]);
    }

    // Trova il valore di epsilon ottimale
    optimalE = findOptimalE(deltas);
    console.log("Optimal e: " + optimalE);

    graficoRelazione(arrayEpsilon, arrayNumeroElementiPrimoCluster, arrayNumeroElementiNoise);
    graficoEpsilonNumeroCluster(arrayEpsilon, arrayNumeroCluster);
    grafico3D(makeCluster(arrayArray, optimalE, minPoints).clusters, arrayArray);

}

/**
 * Genera un grafico 3D dei cluster prodotti da DBSCAN
 * @param {Array} clusters - Cluster generati da DBSCAN
 * @param {Array} dataset - Dataset originale
 */
function grafico3D(clusters, dataset) {
    let dataToBePlotted = [];
    clusters.forEach((cluster, index) => {
        let arrayX = [], arrayY = [], arrayZ = [];
        cluster.forEach((value) => {
            arrayX.push(dataset[value][0]);
            arrayY.push(dataset[value][1]);
            arrayZ.push(dataset[value][2]);
        });

        // Crea una traccia per ogni cluster
        let trace = {
            x: arrayX,
            y: arrayY,
            z: arrayZ,
            mode: 'markers',
            name: 'Cluster ' + (index + 1),
            marker: {
                size: 5,
                line: { width: 0.1 },
                opacity: 1,
            },
            type: 'scatter3d'
        };
        dataToBePlotted.push(trace);
    });

    let layout = {
        title: 'DBSCAN-generated clusters',
        xaxis: { title: 'PC1' },
        yaxis: { title: 'PC2' },
        zaxis: { title: 'PC3' }
    };
    console.log("Data to be plotted:", dataToBePlotted);
    nodeplotlib.plot(dataToBePlotted, layout);
}

/**
 * Genera un grafico della relazione tra epsilon, il cluster più grande e i punti noise
 * @param {Array} epsilons - Valori di epsilon
 * @param {Array} primocluster - Numero di elementi nel cluster più grande
 * @param {Array} noise - Numero di elementi noise
 */
function graficoRelazione(epsilons, primocluster, noise) {
    let trace1 = { x: epsilons, y: primocluster, type: 'scatter', name: 'Numero di elementi contenuti nel Cluster più grande' };
    let trace2 = { x: epsilons, y: noise, type: 'scatter', name: 'Numero di elementi Noise' };
    let data = [trace1, trace2];
    let layout = {
        title: 'Relazione tra epsilon e risultati',
        xaxis: { title: 'Epsilon' },
        yaxis: { title: 'Numero elementi' }
    };
    nodeplotlib.plot(data, layout);
}

/**
 * Genera un grafico della relazione tra epsilon e il numero di cluster
 * @param {Array} epsilons - Valori di epsilon
 * @param {Array} arrayNumeroCluster - Numero di cluster per ogni epsilon
 */
function graficoEpsilonNumeroCluster(epsilons, arrayNumeroCluster) {
    let trace1 = { x: epsilons, y: arrayNumeroCluster, type: 'scatter', name: 'Numero di clusters' };
    let data = [trace1];
    let layout = {
        title: 'Relazione tra epsilon e numero di cluster',
        xaxis: { title: 'Epsilon' },
        yaxis: { title: 'Numero cluster' }
    };
    nodeplotlib.plot(data, layout);
}

/**
 * Esegue l'algoritmo DBSCAN con i parametri forniti
 * @param {Array} dataset - Dataset su cui eseguire il clustering
 * @param {number} epsilon - Distanza massima per considerare due punti vicini
 * @param {number} minimumPoints - Numero minimo di punti per formare un cluster
 * @returns {Object} Risultato del clustering
 */
function makeCluster(dataset, epsilon, minimumPoints) {
    return dbscan({
        dataset: dataset,
        epsilon: epsilon,
        distanceFunction: calcolaDistanze,
        minimumPoints: minimumPoints
    });
}

/**
 * Calcola la distanza euclidea tra due punti
 * @param {Array} puntoA - Primo punto
 * @param {Array} puntoB - Secondo punto
 * @returns {number} Distanza tra i due punti
 */
function calcolaDistanze(puntoA, puntoB) {
    return Math.sqrt(puntoA.reduce((sum, val, i) => sum + Math.pow(val - puntoB[i], 2), 0));
}

/**
 * Trova l'indice dell'array più grande in un array di array
 * @param {Array} arrayArray - Array di array
 * @returns {number} Indice dell'array più grande
 */
function findIndexOfBiggestArray(arrayArray) {
    const lengths = arrayArray.map(a=>a.length);
    return lengths.indexOf(Math.max(...lengths));
}

/**
 * Trova il valore di epsilon ottimale basato sulla differenza minima tra cluster e noise
 * @param {Array} myDeltas - Array di delta ed epsilon
 * @returns {number} Valore di epsilon ottimale
 */
function findOptimalE(myDeltas) {
    const index = myDeltas.map(val => val[0]).indexOf(Math.min(...myDeltas.map(val => val[0])));
    return myDeltas[index][1];
}

// Esporta la funzione principale
exports.dbscan = main;