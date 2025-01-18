/**
 * Importa il modulo `nodeplotlib` per la visualizzazione di grafici e plot.
 * @module nodeplotlib
 */
var nodeplotlib = require('nodeplotlib');

/**
 * Importa la libreria `data-forge` per l'analisi e la manipolazione di dataset.
 * @module data-forge
 */
var dataForgeLib = require('data-forge');

/**
 * Importa il modulo `clusters` per l'esecuzione di algoritmi di clustering.
 * @module clusters
 */
var clusterMaker = require('clusters');

/**
 * Importa il modulo `data-forge-fs` per la lettura e scrittura di file tramite `data-forge`.
 * @module data-forge-fs
 */
require('data-forge-fs');

/**
 * La funzione principale per eseguire il processo di clustering delle canzoni utilizzando le componenti principali (PCA)
 * e i dati normalizzati, quindi crea delle playlist in base ai cluster generati e le prepara per essere inviate tramite
 * le API di Spotify.
 *
 * 1. Legge il file CSV contenente i dati delle componenti principali.
 * 2. Normalizza i dati e li converte in un formato utilizzabile.
 * 3. Calcola il numero ottimale di cluster tramite il metodo del "grafico del punto di gomito".
 * 4. Applica un algoritmo di clustering per raggruppare i dati.
 * 5. Crea una playlist per ogni gruppo di canzoni basato sui cluster, usando i dati delle canzoni e le API di Spotify.
 *
 * @param {string} pathPCA - Il percorso del file CSV contenente i dati delle componenti principali, risultati da un'analisi PCA.
 * @param {string} pathStandardizzato - Il percorso del file CSV contenente i dati delle canzoni normalizzati.
 *
 * @returns {Array} - Un array contenente:
 *   1. I cluster calcolati tramite l'algoritmo di clustering.
 *   2. Le playlist create in base ai cluster.
 *   3. Il dataset delle Componenti Principali, rappresentato come un array di array.
 *   4. Il dataset completo normalizzato come array.
 */
function main(pathPCA, pathStandardizzato) {

    // Legge il file CSV contenente i dati delle Componenti Principali e li converte in un DataFrame
    let dataFramePC = dataForgeLib.readFileSync(pathPCA).parseCSV();

    // 1. Estrae i nomi delle colonne generate dall'analisi PCA e converte ogni colonna in numeri
    let columnNames = dataFramePC.getColumnNames();
    for (i = 0; i < columnNames.length; i++)
        dataFramePC = dataFramePC.parseFloats(columnNames[i]);

    // Converte il DataFrame in un array di righe (ogni riga rappresenta una canzone)
    let datasetPCA = dataFramePC.toRows();

    // Legge il file CSV contenente i dati normalizzati
    dataFramePC = dataForgeLib.readFileSync(pathStandardizzato).parseCSV();
    let datasetCompleto = dataFramePC.toArray();

    // 2. Determina il numero ottimale di cluster utilizzando il metodo del punto di gomito
    const elbowPointIndex = elbowPoint(datasetPCA, 2, 10);  //passato il numero min e max di cluster
    console.log("Punto di gomito: " + elbowPointIndex);

    // 3. Esegue il clustering con il numero di cluster ottimale
    const clusters = makeCluster(elbowPointIndex, 1000, datasetPCA);

    // 4. Crea le playlist in base ai cluster calcolati, utilizzando i punti di ciascun cluster e i dati completi delle canzoni
    let playlists = [];
    var i = 0;
    while (i < clusters.length) {
        // Crea una playlist per ogni cluster
        var playlist = fromPointsToSong(clusters[i].points, datasetPCA, datasetCompleto);
        playlists.push(playlist);
        i++;
    }

    // Restituisce i risultati: i cluster, le playlist, il dataset PCA e il dataset completo
    return [clusters, playlists, datasetPCA, datasetCompleto];
}


/**
 * Genera un grafico a barre (barchart) per una determinata caratteristica (feature)
 * di un cluster di canzoni. Il grafico include tre tracce:
 * 1. I valori della feature per le canzoni del cluster.
 * 2. La media della feature per il cluster.
 * 3. La media della feature per l'intero dataset.
 *
 * @param {Array} puntiCluster - I punti che rappresentano il cluster attuale.
 * @param {string} feature - Il nome della feature da analizzare (es. "danceability", "energy").
 * @param {Array} datasetCluster - Il dataset PCA contenente i punti dei cluster.
 * @param {Array} datasetCompleto - Il dataset completo normalizzato.
 * @param {number} nCluster - L'indice del cluster attuale (per il titolo del grafico).
 */
function barChart(puntiCluster, feature, datasetCluster, datasetCompleto, nCluster) {
    // Ottiene le canzoni appartenenti al cluster attuale
    let songs = fromPointsToSong(puntiCluster, datasetCluster, datasetCompleto);

    // Crea un array per memorizzare i valori della feature per ciascuna canzone del cluster
    var valoriFeature = [];
    for (let i = 0; i < songs.length; i++) {
        // Converte il valore della feature in numero decimale e lo aggiunge all'array
        valoriFeature.push(parseFloat(songs[i][feature]));
    }

    // Definisce la prima traccia: i valori della feature per ciascuna canzone nel cluster
    var trace1 = {
        x: [...Array(songs.length).keys()], // Indici delle canzoni (asse X)
        y: valoriFeature, // Valori della feature per le canzoni (asse Y)
        name: 'Canzone',
        marker: {
            color: "rgb(0, 71, 171)", // Colore delle barre
            line: {
                color: "rgb(0, 71, 171)", // Colore del contorno delle barre
                width: 1 // Spessore del contorno
            }
        },
        opacity: 0.5, // Trasparenza delle barre
        type: "bar", // Tipo di grafico: barre
    };

    // Definisce la seconda traccia: la media della feature per il cluster
    var trace2 = {
        y: new Array(songs.length).fill(valoreMedio(valoriFeature)), // Valore costante: media del cluster
        x: [...Array(songs.length).keys()], // Stessa X delle canzoni
        marker: {
            color: "rgb(255, 87, 51)", // Colore della linea
            line: {
                color: "rgb(255, 87, 51)", // Colore del contorno
                width: 1 // Spessore del contorno
            }
        },
        name: 'Media del cluster',
        type: 'scatter' // Tipo di grafico: linea
    };

    // Definisce la terza traccia: la media della feature per l'intero dataset
    var trace3 = {
        y: new Array(songs.length).fill(valoreMedio(datasetCompleto, feature)), // Valore costante: media del dataset
        x: [...Array(songs.length).keys()], // Stessa X delle canzoni
        marker: {
            color: "rgb(40, 167, 69)", // Colore della linea
            line: {
                color: "rgb(40, 167, 69)", // Colore del contorno
                width: 1 // Spessore del contorno
            }
        },
        name: 'Media del dataset',
        type: 'scatter' // Tipo di grafico: linea
    };

    // Combina tutte le tracce in un unico array
    var data = [trace1, trace2, trace3];

    // Configura il layout del grafico
    var layout = {
        bargap: 0.05, // Spaziatura tra le barre
        bargroupgap: 0.2, // Spaziatura tra i gruppi di barre
        barmode: "overlay", // Sovrapposizione delle barre
        title: "Cluster " + nCluster, // Titolo del grafico
        xaxis: { title: "Canzone" }, // Etichetta asse X
        yaxis: { title: feature } // Etichetta asse Y
    };

    // Utilizza la libreria nodeplotlib per tracciare il grafico
    nodeplotlib.plot(data, layout);
}


//Funzione che ritorna le percentuali di genere all'interno di un cluster
function categorizzazioneCluster(points,datasetPCA,datasetCompleto){
    var generiPrincipali=["alternative","jazz","pop","indie","rock","country","dance","hip hop","metal","blues","folk","soul","carnaval","punk","disco","electro","rap","latin","reggae","altri"];
    //1. Prendo tutti i generi del cluster
    var generi=[];
    generi=researchGenreCluster(points,datasetPCA,datasetCompleto);

    //2. Canzoni per categoria
    var conteggioGeneri=[];

    // Azzero l'array
    for(j=0;j<20;j++)
        conteggioGeneri[j]=0;

    for(z=0;z<generi.length;z++){
        if(generi[z].includes(generiPrincipali[0]))
            conteggioGeneri[0]++;
        else
        if(generi[z].includes(generiPrincipali[1]))
            conteggioGeneri[1]++;
        else
        if(generi[z].includes(generiPrincipali[2]))
            conteggioGeneri[2]++;
        else
        if(generi[z].includes(generiPrincipali[3]))
            conteggioGeneri[3]++;
        else
        if(generi[z].includes(generiPrincipali[4]))
            conteggioGeneri[4]++;
        else
        if(generi[z].includes(generiPrincipali[5]))
            conteggioGeneri[5]++;
        else
        if(generi[z].includes(generiPrincipali[6]))
            conteggioGeneri[6]++;
        else
        if(generi[z].includes(generiPrincipali[7]))
            conteggioGeneri[7]++;
        else
        if(generi[z].includes(generiPrincipali[8]))
            conteggioGeneri[8]++;
        else
        if(generi[z].includes(generiPrincipali[9]))
            conteggioGeneri[9]++;
        else
        if(generi[z].includes(generiPrincipali[10]))
            conteggioGeneri[10]++;
        else
        if(generi[z].includes(generiPrincipali[11]))
            conteggioGeneri[11]++;
        else
        if(generi[z].includes(generiPrincipali[12]))
            conteggioGeneri[12]++;
        else
        if(generi[z].includes(generiPrincipali[13]))
            conteggioGeneri[13]++;
        else
        if(generi[z].includes(generiPrincipali[14]))
            conteggioGeneri[14]++;
        else
        if(generi[z].includes(generiPrincipali[15]))
            conteggioGeneri[15]++;
        else
        if(generi[z].includes(generiPrincipali[16]))
            conteggioGeneri[16]++;
        else
        if(generi[z].includes(generiPrincipali[17]))
            conteggioGeneri[17]++;
        else
        if(generi[z].includes(generiPrincipali[18]))
            conteggioGeneri[18]++;
        else
            conteggioGeneri[19]++;
    }

    //3. Stringa percentuale
    var percentuale="";
    for(i=0;i<generiPrincipali.length;i++)
        if(conteggioGeneri[i]!=0)
            percentuale+=generiPrincipali[i]+": "+((conteggioGeneri[i]/points.length) * 100).toFixed(0)+"%\n";

    return percentuale;
}
//Funzione che controlla se due punti hanno le stesse cordinate
function control_point(point,pointControl){
    var riscontro=false;
    for(cordinata=0;cordinata<point.length;cordinata++){
        if(point[cordinata]==pointControl[cordinata])
            riscontro=true;
        else
            return false;
    }
    return riscontro;
}

/**
 * Calcola il "Elbow Point" (punto di ginocchio) per determinare il numero ottimale di cluster
 * utilizzando il metodo SSE (Sum of Squared Errors) e genera un grafico per visualizzarlo.
 *
 * @param {Array} dataset - Il dataset su cui eseguire il clustering.
 * @param {number} min - Il valore minimo di k (numero di cluster da analizzare).
 * @param {number} max - Il valore massimo di k (numero di cluster da analizzare).
 * @returns {number} - Il valore ottimale di k (elbow point).
 */
function elbowPoint(dataset, min, max) {
    let kmin = min; // Valore minimo di k
    let kmax = max; // Valore massimo di k
    let sse = []; // Array per memorizzare i valori di SSE (Somma dei Quadrati degli Errori)

    // Calcolo SSE per ogni valore di k. SSE (Sum of Squared Errors), noto anche come somma dei quadrati degli errori, è una metrica utilizzata per valutare la qualità dei cluster in algoritmi di clustering come il K-Means.
    for (let k = kmin; k <= kmax; k++) {
        clusterMaker.k(k); // Imposta il numero di cluster
        clusterMaker.iterations(100); // Imposta il numero massimo di iterazioni
        clusterMaker.data(dataset); // Assegna il dataset al clustering
        let cluster = clusterMaker.clusters(); // Ottieni i cluster generati

        // Calcolo della somma delle distanze per i punti di ciascun cluster
        let distortions = 0;
        for (let i = 0; i < k; i++) {
            distortions += sommaDistanze(cluster[i].centroid, cluster[i].points);
        }
        sse.push(distortions); // Aggiunge il valore SSE per il valore corrente di k
    }

    // Calcolo delle variazioni tra SSE consecutivi per identificare il ginocchio (elbow point)
    let deltas = [];
    for (let i = 1; i < sse.length - 1; i++) {
        let delta1 = Math.abs(sse[i] - sse[i - 1]); // Differenza tra k e k-1
        let delta2 = Math.abs(sse[i + 1] - sse[i]); // Differenza tra k+1 e k
        deltas.push(Math.abs(delta2 - delta1)); // Calcola la variazione tra i due delta
    }

    // Trova il massimo delta, che corrisponde al punto di ginocchio
    const maximumDelta = Math.max(...deltas);
    const elbowPoint = deltas.indexOf(maximumDelta) + 1 + kmin;

    // Crea un array con i valori di k per l'asse X
    let coordinateX = [];
    for (let k = 0; k < sse.length; k++) {
        coordinateX[k] = kmin + k;
    }

    // Generazione del grafico per visualizzare l'andamento di SSE rispetto al numero di cluster
    var trace1 = {
        x: coordinateX, // Numero di cluster (asse X)
        y: sse, // Valori di SSE (asse Y)
        type: 'scatter', // Tipo di grafico: linea
        name: 'SSE per ogni k'
    };
    var data = [trace1];
    var layout = {
        title: 'Elbow Point', // Titolo del grafico
        xaxis: {
            title: 'Numero di Cluster (k)' // Etichetta asse X
        },
        yaxis: {
            title: 'SSE (Sum of Squared Errors)' // Etichetta asse Y
        }
    };

    // Traccia il grafico utilizzando nodeplotlib
    nodeplotlib.plot(data, layout);

    return elbowPoint; // Restituisce il valore ottimale di k
}

//Funzione usata per estrarre da un array di punti solo una determinata coordinata
function extractColum(points,coordinata){
    var elementiColonna=[];
    for(i=0;i<points.length;i++)
        elementiColonna.push(points[i][coordinata]);
    return elementiColonna;
}

/**
 * Funzione per ottenere le canzoni associate a un insieme di punti clusterizzati.
 *
 * @param {Array} points - Array di punti (coordinate) appartenenti a un cluster.
 * @param {Array} datasetCluster - Cluster da cui estrarre
 * @param {Array} datasetCompleto - Dataset completo contenente i dettagli delle canzoni.
 * @returns {Array} songs - Array di canzoni corrispondenti ai punti del cluster.
 */
function fromPointsToSong(points, datasetCluster, datasetCompleto) {
    var songs = []; // Array per memorizzare le canzoni corrispondenti ai punti.

    // Per ogni punto nel cluster...
    for (let i = 0; i < points.length; i++) {
        // ...verifica se esiste un punto con le stesse coordinate nel dataset clusterizzato.
        for (let j = 0; j < datasetCluster.length; j++) {
            if (control_point(points[i], datasetCluster[j])) {
                // Se c'è una corrispondenza, aggiungi la canzone corrispondente dal dataset completo.
                songs.push(datasetCompleto[j]);
            }
        }
    }

    return songs; // Restituisce l'array di canzoni trovate.
}

//Funzione usata per generare un grafico radar dei cluster creati
function graficoRadar(clusters, datasetCluster,datasetCompleto,rangeMin=-2,rangeMax=6){

    var j=0;
    var data=[];

    while(j<clusters.length) {
        var songs=fromPointsToSong(clusters[j].points,datasetCluster,datasetCompleto);
        var trace = {
            type: 'scatterpolar',
            r: [ valoreMedio(songs,"Beats Per Minute (BPM)"),valoreMedio(songs,"Energy"), valoreMedio(songs,"Danceability"),
                valoreMedio(songs,"Loudness (dB)"), valoreMedio(songs,"Liveness"),
                valoreMedio(songs,"Valence"),
                valoreMedio(songs,"Acousticness"), valoreMedio(songs,"Speechiness")],
            theta: ["Beats Per Minute (BPM)","Energy","Danceability","Loudness (dB)","Liveness","Valence","Acousticness","Speechiness"],
            fill: 'toself',
            name: 'Cluster '+ j,
        };
        data.push(trace);
        j = j + 1;
    }

    layout = {
        polar: {
            radialaxis: {
                visible: true,
                range: [rangeMin, rangeMax]
            }
        }
    }

    nodeplotlib.plot(data,layout);
}
//Funzione usata per generare un grafico 3D che mostra i punti nello spazio
function grafico3D(clusters,datasetCluster,datasetCompleto){

    var dataToBePlotted=[];
    var i=0;

    let songs = [ ];

    //Per ogni cluster creato
    while(i<clusters.length) {

        const _x = extractColum(clusters[i].points,0);
        const _y = extractColum(clusters[i].points,1);
        const _z = extractColum(clusters[i].points,2);

        const _title = researchTitleCluster(clusters[i].points,datasetCluster,datasetCompleto);
        const _genere = researchGenreCluster(clusters[i].points,datasetCluster,datasetCompleto);

        for(let p = 0; p < _x.length; p++) {
            const song = {
                x: _x[p],
                y: _y[p],
                z: _z[p],
                title: _title[p],
                genere: _genere[p].trim()
            }
            songs.push(song);
        }

        let trace = {
            x: _x,
            y: _y,
            z: _z, //Do tutte le canzoni che compongono il cluster
            mode: 'markers',
            name:"Trace " + i + ": " + categorizzazioneCluster(clusters[i].points,datasetCluster,datasetCompleto),
            marker: {
                size: 5,
                line: {
                    width: 0.1
                },
                opacity: 1,
            },
            text: _title, //Ottengo un array di titoli per le canzoni che compongono il cluster
            type: 'scatter3d'
        };

        dataToBePlotted.push(trace);
        i=i+1;

    }

    var layout = {
        title: 'K-Means generated clusters',
        legend: {
            "orientation": "h"
        }
    };

    nodeplotlib.plot(dataToBePlotted,layout);
    //  nodeplotlib.plot(dataToBePlotted2, layout);

}
//Funzione che genera un barchart per ogni cluster
function makeBarChart(clusters, feature, datasetCluster, datasetCompleto){
    clusters.forEach((value, index, array)=>{
        barChart(value.points, feature, datasetCluster, datasetCompleto, index );
    });
}
//Funziona che genera dei cluster su un dataset
function makeCluster(numberOfClusters, iterations, dataset){
    clusterMaker.k(numberOfClusters);
    clusterMaker.iterations(iterations);
    clusterMaker.data(dataset);
    return clusterMaker.clusters();
}
//Funzione che restituisce il genere di tutti i punti di un cluster
function researchGenreCluster(points,datasetPCA,datasetCompleto){
    var j=0;
    var genereSongs=[];
    do{
        var cordX =points[j][0];
        var cordY =points[j][1];
        var cordZ =points[j][2];
        var genere='';
        for (i = 0; i < datasetPCA.length; i++) {
            if (cordX == datasetPCA[i][0]  && cordY == datasetPCA[i][1] && cordZ == datasetPCA[i][2]) {
                genere=genere+' '+datasetCompleto[i]['Top Genre'];
            }
        }
        genereSongs.push(genere);
        j++;
    }while(j<points.length)
    return genereSongs;
}
//Funzione che restituisce il titolo delle canzoni di tutti i punti di un cluster
function researchTitleCluster(points,datasetPCA,datasetCompleto){
    var j=0;
    var nameSongs=[];
    do{
        var cordX =points[j][0];
        var cordY =points[j][1];
        var cordZ =points[j][2];
        var title='';
        for (i = 0; i < datasetPCA.length; i++) {
            if (cordX == datasetPCA[i][0]  && cordY == datasetPCA[i][1] && cordZ == datasetPCA[i][2]) {
                title=title+' '+datasetCompleto[i].Title;
            }
        }
        nameSongs.push(title);
        j++;
    }while(j<points.length)
    return nameSongs;
}

/**
 * Calcola la somma delle distanze euclidee tra un centroide e un insieme di punti.
 *
 * @param {Array<number>} centroide - Coordinate del centroide (array di dimensione d).
 * @param {Array<Array<number>>} punti - Insieme di punti, ognuno rappresentato come array di dimensione d.
 * @returns {number} - Somma delle distanze euclidee tra il centroide e tutti i punti.
 */
function sommaDistanze(centroide, punti) {
    let somma = 0; // Variabile per accumulare la somma delle distanze.
    const dimension = centroide.length; // Numero di dimensioni del centroide (uguale a quella dei punti).

    // Itero su ogni punto del cluster
    for (i = 0; i < punti.length; i++) {
        let sommaDimensioni = 0; // Somma delle differenze al quadrato per ogni dimensione.

        // Calcolo la distanza al quadrato tra il punto e il centroide per ogni dimensione.
        for (j = 0; j < dimension; j++) {
            sommaDimensioni += Math.pow(punti[i][j] - centroide[j], 2);
        }

        // Aggiungo la radice quadrata (distanza euclidea) alla somma totale.
        somma += Math.sqrt(sommaDimensioni);
    }

    return somma; // Restituisco la somma delle distanze.
}


//Funzione che calcola il valore medio di una feature in un array
function valoreMedio(array, feature = undefined){
    let n = array.length;
    let sum = 0;
    array.forEach((value, index, array)=>{
        const val = feature==undefined?value:value[feature];
        if(val!=""||val){
            sum += parseFloat(val);
        } else {
            n--;
        }
    });
    return sum/n;
}


function graficoElbowPointByVarianza(gomito,varianza){
    //Generazione del grafico
    var trace1 = {
        x: varianza,
        y: gomito,
        type: 'scatter'
    };
    var data = [trace1];
    var layout = {
        title: 'Gomito data la varianza della PCA',
        xaxis: {
            title: 'Varianza',
        },
        yaxis: {
            title: 'Gomito',
        }
    };

    nodeplotlib.plot(data,layout);
}

function graficoNumeroPuntiClusterByVarianza(numeroPunti,numeroCluster,percentualVarianza){

    var data = [];
    var i=0;
    while (i<percentualVarianza.length){
        var trace = {
            x: numeroCluster[i],
            y: numeroPunti[i],
            name: 'Percentual Varianza:'+ percentualVarianza[i],
            type: 'scatter'
        };
        data.push(trace)
        i++;
    }

    var layout = {
        title: 'Variazione numero punti di un cluster in base alla varianza della PCA',
        xaxis: {
            title: 'Cluster',
        },
        yaxis: {
            title: 'Numero Punti',
        }
    };

    nodeplotlib.plot(data,layout);
}



exports.graficoNumeroPuntiClusterByVarianza=graficoNumeroPuntiClusterByVarianza;
exports.graficoElbowPointByVarianza=graficoElbowPointByVarianza;
exports.mainKMeans = main;
exports.grafico3D = grafico3D;
exports.graficoRadar = graficoRadar;
exports.makeHistograms = makeBarChart;
