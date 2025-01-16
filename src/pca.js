var nodeplotlib = require('nodeplotlib');
var pca = require('pca-js');
var dataForgeLib = require('data-forge');
require('data-forge-fs');

const standardizzatoEsportato = './Dataset/datasetNormalizzato.csv';
const pcaOutputPath = './Dataset/datasetPCAOutput.csv';

function pcaWork(datasetDiPartenza,percentualeOttima){

    // Carico il DataSet
    let dataFrame = dataForgeLib.readFileSync(datasetDiPartenza).parseCSV();

    // Definisce le features (caratteristiche) su cui applicare la PCA
    let features = ["Beats Per Minute (BPM)", "Energy","Danceability","Loudness (dB)","Liveness","Valence","Acousticness","Speechiness"];
    let totalFeatures=["Index","Title","Artist","Top Genre","Beats Per Minute (BPM)", "Energy","Danceability","Loudness (dB)","Liveness","Valence","Length (Duration)","Acousticness","Speechiness"];
    let subDataFrame = dataFrame.subset(features);

    // Converte le colonne in array
    var columns = subDataFrame.getColumns();
    var arrayOfColumns = columns.toArray();
    var arrayCompleto= dataFrame.toArray();

    let myColumns = []; // Array per le colonne standardizzate

    // Standardizza ogni colonna
    for (var column in arrayOfColumns) {
        let myColumn = [];
        myColumn.push(...arrayOfColumns[column].series.content.values);
        standardize(myColumn);
        myColumns.push(myColumn);
    }


    let newDataSource = [];
    for(let i = 0; i < myColumns[0].length; i++) {

        let mySong = { };
        mySong[totalFeatures[0]]=arrayCompleto[i].Index;
        mySong[totalFeatures[1]]=arrayCompleto[i].Title;
        mySong[totalFeatures[2]]=arrayCompleto[i].Artist;
        mySong[totalFeatures[3]]=arrayCompleto[i]['Top Genre']; //Senza le virgolette, il nome della chiave sarebbe interpretato come due variabili separate e il codice non funzionerebbe.
        // Aggiungi i dati delle features
        for(let j = 0; j < myColumns.length; j++){
            let name = features[j];
            mySong[name] = myColumns[j][i];
        }
        newDataSource.push(mySong);

    }

    // Crea un nuovo DataFrame con i dati normalizzati
    let normalizedDataFrame  = new dataForgeLib.DataFrame({
        values: newDataSource
    });

    // Esporta il dataset normalizzato in CSV
    normalizedDataFrame.asCSV().writeFileSync(standardizzatoEsportato );
    subDataFrame = normalizedDataFrame .subset(features);

    // Converte il Dataset in array di righe
    let data = subDataFrame.toRows();

    // Numero di elementi (canzoni) nel DataSet
    let dimension = data.length;

    // Calcola gli autovettori e gli autovalori per la PCA
    var vectors = pca.getEigenVectors(data);

    //Percentuale di accuratezza considerando il primo, i primi due e i primi tre autovettori
    console.log("Percentuali di varianza calcolati: ");
    let v = [];
    let percentualiVarianza = [];
    let percentuale;
    let i;
    for(i = 0; i < vectors.length; i++) {
        v.push(vectors[i]);
        percentuale=pca.computePercentageExplained(vectors, ...v);
        percentualiVarianza.push(percentuale);
        console.log(i+1 +" : "+percentuale);
        if(percentuale>=percentualeOttima) {
            break;
        }
    }
    // Grafico della varianza delle componenti principali
    graficoComponentiVarianza(vectors);

    // Calcola i dati trasformati (adattati) in base alle componenti principali
    let adjustedData  = pca.computeAdjustedData(data, ...v).adjustedData; // N.B. Array di array


    // Nuovo DataSource che conterrà il DataSet trasformato in base alle Componenti Principali individuate.
    let newDataSourcePCA  = [];
    let elementi=[];
    //For per ottenere le scritte PC1,PC2... in base a quanti vettori ho usato per la pca
    for(j=0;j<adjustedData .length;j++) {
        elementi.push('PC'+(j+1));
    }

    // Riempo il nuovo DataSource
    for (let i = 0; i < dimension; i++){

        let mySong = {};
        for(j=0;j<adjustedData .length;j++)
            mySong[elementi[j]] = adjustedData[j][i];


        newDataSourcePCA .push(mySong);

    }

    // Creo nuovo DataFrame dal DataSource e poi lo esporto
    let newDataFrame2 = new dataForgeLib.DataFrame({
        values: newDataSourcePCA
    });
    newDataFrame2.asCSV().writeFileSync(pcaOutputPath);

    return [standardizzatoEsportato, pcaOutputPath];

}

function graficoComponentiVarianza(vectors){

    let v = [];
    let percentualiVarianza = [];
    let percentuale;
    let i;
    for(i = 0; i < vectors.length; i++) {
        v.push(vectors[i]);
        percentuale=pca.computePercentageExplained(vectors, ...v);
        percentualiVarianza.push(percentuale);
    }

    let componenti = [...Array(++i).keys()].map(x=>x+1);

    //Generazione del grafico
    var trace1 = {
        x: componenti,
        y: percentualiVarianza,
        type: 'scatter'
    };
    var data = [trace1];
    var layout = {
        title: 'Variazione numero componenti in base alla varianza della PCA',
        xaxis: {
            title: 'Numero Componenti',
        },
        yaxis: {
            title: 'Percentuale Varianza',
        }
    };

    nodeplotlib.plot(data,layout);

}

function getStandardDeviation(numbersArr, meanVal) {

    var SDprep = 0;
    for(var key in numbersArr) {
        if(numbersArr[key]!=""||numbersArr[key]){
            SDprep += Math.pow((parseFloat(numbersArr[key]) - meanVal),2);
        }
    }
    var SDresult = Math.sqrt(SDprep/numbersArr.length);
    return SDresult;

}

function getMean(array){
    let n = array.length;
    let sum = 0;
    array.forEach((value, index, array)=>{
        if(value!=""||value){
            sum += parseInt(value);
        } else {
            n--;
        }
    });
    return sum/n;
}

function standardize(array){
    const mean = getMean(array);
    const standardDeviation = getStandardDeviation(array, mean);
    array.forEach((value, index, array)=>{
        zscore = (value - mean)/standardDeviation;
        array[index] = zscore;
    });
}

function normalize(val, max, min) {
    return (val - min) / (max - min);
}

/* Used in app.js as stand-alone */
function graficoComonetiPrecisioneVarianza(datasetDiPartenza){
    // Carico il DataSet
    let dataFrame = dataForgeLib.readFileSync(datasetDiPartenza).parseCSV();

    // Seleziono solo le features che mi interessano
    let features = ["Beats Per Minute (BPM)", "Energy","Danceability","Loudness (dB)","Liveness","Valence","Length (Duration)","Acousticness","Speechiness"];
    let totalFeatures=["Index","Title","Artist","Top Genre","Beats Per Minute (BPM)", "Energy","Danceability","Loudness (dB)","Liveness","Valence","Length (Duration)","Acousticness","Speechiness"];
    let subDataFrame = dataFrame.subset(features);

    var columns = subDataFrame.getColumns();
    var arrayOfColumns = columns.toArray();
    var arrayCompleto= dataFrame.toArray();

    let myColumns = []; // Array di array (ogni array e' una colonna)

    for (var column in arrayOfColumns) {
        let myColumn = [];
        myColumn.push(...arrayOfColumns[column].series.content.values);
        standardize(myColumn);
        myColumns.push(myColumn);
    }

    //Normalizzazione valori tra 0 e 1
    for(i=0;i<myColumns.length;i++){
        var max=-100,min=100;
        //Ricero il massimo e il minimo
        for(j=0;j<myColumns[i].length;j++){
            if(max<myColumns[i][j])
                max=myColumns[i][j];
            if(min>myColumns[i][j])
                min=myColumns[i][j];
        }
        //Normalizzo i valori
        for(j=0;j<myColumns[i].length;j++){
            myColumns[i][j]=normalize(myColumns[i][j],max,min);
        }
    }


    let newDataSource = [];
    for(let i = 0; i < myColumns[0].length; i++) {

        let mySong = { };
        mySong[totalFeatures[0]]=arrayCompleto[i].Index;
        mySong[totalFeatures[1]]=arrayCompleto[i].Title;
        mySong[totalFeatures[2]]=arrayCompleto[i].Artist;
        mySong[totalFeatures[3]]=arrayCompleto[i]['Top Genre'];
        for(let j = 0; j < myColumns.length; j++){
            let name = features[j];
            mySong[name] = myColumns[j][i];
        }
        newDataSource.push(mySong);

    }

    let normalizedDataFrame  = new dataForgeLib.DataFrame({
        values: newDataSource
    });


    subDataFrame = normalizedDataFrame .subset(features);

    // DataSet come array di array
    let data = subDataFrame.toRows();



    // Calcolo autovettori e autovalori per PCA
    var vectors = pca.getEigenVectors(data);

    //Percentuale di accuratezza considerando il primo, i primi due e i primi tre autovettori
    console.log("Percentuali: ");
    let v = [];
    let percentuale;

    let numeroComponentiUsate=[];
    let percentuali=[];
    for(let i = 0; i < vectors.length; i++) {
        v.push(vectors[i]);
        numeroComponentiUsate.push(v.length);
        percentuali.push(pca.computePercentageExplained(vectors, ...v));
    }


    var trace1 = {
        x: numeroComponentiUsate,
        y: percentuali,
        type: 'scatter'
    };

    var dataGrafico=[trace1];
    var layout = {
        title: 'Variazione numero componenti in base alla varianza della PCA',
        xaxis: {
            title: 'Numero Componenti',
        },
        yaxis: {
            title: 'Percentuale Varianza',
        }
    };

    nodeplotlib.plot(dataGrafico,layout);
}

exports.graficoComonetiPrecisioneVarianza=graficoComonetiPrecisioneVarianza;
exports.pcaProcess = pcaWork;

