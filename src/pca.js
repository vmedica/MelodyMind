
var dataForge = require('data-forge');

function pcaWork(datasetIniziale, percentuale){
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

    for (var colonna of colonneArray) {
        let colonnaValori = [...colonna.series.content.values];
        normalizzaZScore(colonnaValori);
        datiNormalizzati.push(colonnaValori);
    }

}