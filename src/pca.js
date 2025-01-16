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

    // Converte il DataFrame normalizzato in formato CSV e lo scrive su un file specificato da 'fileStandardizzato'.
    let dataFrameNormalizzato = new dataForgeLib.DataFrame({
        values: datasetNormalizzato
    });
    dataFrameNormalizzato.asCSV().writeFileSync(fileStandardizzato);

    // Applicazione della PCA
    let datasetArray = dataFrameNormalizzato.subset(colonneSelezionate).toRows();
    let autovettori = pcaLib.getEigenVectors(datasetArray);

    // Calcolo della percentuale di varianza spiegata per determinare il numero ottimale di componenti
    let vettoriSelezionati = [];
    let percentualiVarianza = [];
    let i;
    for (i = 0; i < autovettori.length; i++) {
        vettoriSelezionati.push(autovettori[i]);    // 1. Aggiunge il vettore corrente ('autovettori[i]') all'array dei vettori selezionati.
        let percentuale = pcaLib.computePercentageExplained(autovettori, ...vettoriSelezionati); // 2. Calcola la percentuale di varianza spiegata usando una funzione della libreria PCA ('computePercentageExplained').
        percentualiVarianza.push(percentuale); // 3. Aggiunge la percentuale calcolata all'array delle percentuali di varianza ('percentualiVarianza').
        if (percentuale >= sogliaVarianza) { // 4. Se la percentuale di varianza spiegata raggiunge o supera una soglia prefissata ('sogliaVarianza'),
            break;  //    il ciclo termina, avendo selezionato il numero ottimale di componenti principali.
        }
    }

    // Generazione del grafico delle componenti principali
    creaGraficoVarianza(autovettori);

    // Trasformazione dei dati usando le componenti principali
    let datiTrasformati = pcaLib.computeAdjustedData(datasetArray, ...vettoriSelezionati).adjustedData;

    // Creazione di un nuovo dataset con le componenti principali
    let datasetPCA = [];
    let nomiComponenti = [];
    for (let j = 0; j < datiTrasformati.length; j++) {
        nomiComponenti.push('PC' + (j + 1));
    }

    for (let i = 0; i < datiTrasformati[0].length; i++) {
        let canzoneTrasformata = {};
        for (let j = 0; j < datiTrasformati.length; j++) {
            canzoneTrasformata[nomiComponenti[j]] = datiTrasformati[j][i];
        }
        datasetPCA.push(canzoneTrasformata);
    }

    // Esportazione del dataset con le componenti principali
    let dataFramePCA = new dataForgeLib.DataFrame({
        values: datasetPCA
    });
    dataFramePCA.asCSV().writeFileSync(filePCA);

    return [fileStandardizzato, filePCA];

    //return [standardizzatoEsportato, pcEsportato];
}