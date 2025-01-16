// Import delle librerie necessarie
var nodeplotlib = require('nodeplotlib');
var pcaLib = require('pca-js');
var dataForge = require('data-forge');
require('data-forge-fs');

// Percorsi dei file per l'esportazione dei dataset
const fileStandardizzato = './datasource/datasetNormalizzato.csv';
const filePCA = './datasource/datasetPCA.csv';

function pcaWork(datasetIniziale, sogliaVarianza){
    // Caricamento del dataset dal file
    let dataset = dataForgeLib.readFileSync(fileOrigine).parseCSV();

    // Selezione delle colonne di interesse (caratteristiche musicali)
    let colonneSelezionate = ["Beats Per Minute (BPM)", "Energy", "Danceability", "Loudness (dB)", "Liveness", "Valence", "Acousticness", "Speechiness"];
    let tutteLeColonne = ["Index", "Title", "Artist", "Top Genre", ...colonneSelezionate];
    let sottoDataset = dataset.subset(colonneSelezionate);

    // Normalizzazione dei dati con z-score
    var colonne = sottoDataset.getColumns();
    var colonneArray = colonne.toArray();
    var datiCompleti = dataset.toArray();

    let datiNormalizzati = [];
    /*
     Itera sulle colonne del dataset
     Estrae i valori di ciascuna colonna e li normalizza con lo z-score
     I risultati normalizzati vengono salvati in un array
     */
    for (var colonna of colonneArray) {
        let colonnaValori = [...colonna.series.content.values];
        normalizzaZScore(colonnaValori);
        datiNormalizzati.push(colonnaValori);
    }

    // Creazione di un nuovo dataset normalizzato
    let datasetNormalizzato = [];
    for (let i = 0; i < datiNormalizzati[0].length; i++) {
        let canzone = {};
        canzone[tutteLeColonne[0]] = datiCompleti[i].Index;
        canzone[tutteLeColonne[1]] = datiCompleti[i].Title;
        canzone[tutteLeColonne[2]] = datiCompleti[i].Artist;
        canzone[tutteLeColonne[3]] = datiCompleti[i]['Top Genre'];
        for (let j = 0; j < datiNormalizzati.length; j++) {
            let nomeColonna = colonneSelezionate[j];
            canzone[nomeColonna] = datiNormalizzati[j][i];
        }
        datasetNormalizzato.push(canzone);
    }

    // Esportazione del dataset normalizzato
    let dataFrameNormalizzato = new dataForgeLib.DataFrame({
        values: datasetNormalizzato
    });
    dataFrameNormalizzato.asCSV().writeFileSync(fileStandardizzato);

    // Applicazione della PCA
    let datasetArray = dataFrameNormalizzato.subset(colonneSelezionate).toRows();
    let autovettori = pcaLib.getEigenVectors(datasetArray);



    //return [standardizzatoEsportato, pcEsportato];
}