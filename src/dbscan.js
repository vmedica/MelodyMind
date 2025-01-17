const dbscan = require('@cdxoo/dbscan'); // Algoritmo DBSCAN per clustering
var nodeplotlib = require('nodeplotlib'); // Libreria per generare grafici
var dataForge = require('data-forge'); // Libreria per manipolazione di dataset
require('data-forge-fs'); // Estensione per leggere file CSV con data-forge

const minPoints = 10; // Numero minimo di punti richiesti per formare un cluster


/**
 * Funzione principale che esegue l'algoritmo DBSCAN su un dataset fornito
 * @param {string} pathPC - Percorso del file CSV contenente i dati delle componenti principali
 */
function main(pcaOutputPath){
    //Manipolazione del dataset
    let dataFrame = dataForge.readFileSync(pcaOutputPath).parseCSV(); // Lettura del file CSV come DataFrame
    dataFrame = dataFrame = dataFrame.parseFloats("PC1"); // Parsing della colonna PC1 come float
    dataFrame = dataFrame.parseFloats("PC2");
    dataFrame = dataFrame.parseFloats("PC3");

    let arrayArray = dataFrame.toRows(); // Conversione del DataFrame in array di array (righe come array)


}
