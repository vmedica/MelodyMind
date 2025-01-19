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


/**
 * Funzione che calcola le percentuali di genere musicale all'interno di un cluster.
 *
 * @param {Array} points - Un array di punti del cluster, ciascuno rappresentato come un array di 3 valori (X, Y, Z).
 * @param {Array} datasetPCA - Il dataset PCA contenente le coordinate ridotte delle canzoni.
 * @param {Array} datasetCompleto - Il dataset completo che include informazioni sui generi musicali e altre proprietà delle canzoni.
 *
 * @returns {string} Una stringa che contiene le percentuali dei generi principali presenti nel cluster.
 */
function categorizzazioneCluster(points, datasetPCA, datasetCompleto) {
    // Generi musicali principali di riferimento
    var generiPrincipali = ["alternative", "jazz", "pop", "indie", "rock", "country", "dance",
        "hip hop", "metal", "blues", "folk", "soul", "carnaval", "punk",
        "disco", "electro", "rap", "latin", "reggae", "altri"];

    // 1. Ottieni tutti i generi delle canzoni nel cluster
    var generi = [];
    generi = researchGenreCluster(points, datasetPCA, datasetCompleto);

    // 2. Conteggio delle canzoni per categoria di genere
    var conteggioGeneri = [];

    // Inizializza l'array di conteggi con valori a zero
    for (var j = 0; j < 20; j++) {
        conteggioGeneri[j] = 0;
    }

    // Incrementa il conteggio per ogni genere corrispondente
    for (var z = 0; z < generi.length; z++) {
        if (generi[z].includes(generiPrincipali[0]))
            conteggioGeneri[0]++;
        else if (generi[z].includes(generiPrincipali[1]))
            conteggioGeneri[1]++;
        else if (generi[z].includes(generiPrincipali[2]))
            conteggioGeneri[2]++;
        else if (generi[z].includes(generiPrincipali[3]))
            conteggioGeneri[3]++;
        else if (generi[z].includes(generiPrincipali[4]))
            conteggioGeneri[4]++;
        else if (generi[z].includes(generiPrincipali[5]))
            conteggioGeneri[5]++;
        else if (generi[z].includes(generiPrincipali[6]))
            conteggioGeneri[6]++;
        else if (generi[z].includes(generiPrincipali[7]))
            conteggioGeneri[7]++;
        else if (generi[z].includes(generiPrincipali[8]))
            conteggioGeneri[8]++;
        else if (generi[z].includes(generiPrincipali[9]))
            conteggioGeneri[9]++;
        else if (generi[z].includes(generiPrincipali[10]))
            conteggioGeneri[10]++;
        else if (generi[z].includes(generiPrincipali[11]))
            conteggioGeneri[11]++;
        else if (generi[z].includes(generiPrincipali[12]))
            conteggioGeneri[12]++;
        else if (generi[z].includes(generiPrincipali[13]))
            conteggioGeneri[13]++;
        else if (generi[z].includes(generiPrincipali[14]))
            conteggioGeneri[14]++;
        else if (generi[z].includes(generiPrincipali[15]))
            conteggioGeneri[15]++;
        else if (generi[z].includes(generiPrincipali[16]))
            conteggioGeneri[16]++;
        else if (generi[z].includes(generiPrincipali[17]))
            conteggioGeneri[17]++;
        else if (generi[z].includes(generiPrincipali[18]))
            conteggioGeneri[18]++;
        else
            conteggioGeneri[19]++; // Categoria "altri"
    }

    // 3. Creazione della stringa con le percentuali
    var percentuale = "";
    for (var i = 0; i < generiPrincipali.length; i++) {
        if (conteggioGeneri[i] != 0) {
            percentuale += generiPrincipali[i] + ": " + ((conteggioGeneri[i] / points.length) * 100).toFixed(0) + "%\n";
        }
    }

    // Ritorna la stringa delle percentuali
    return percentuale;
}


/**
 * Controlla se due punti nello spazio hanno le stesse coordinate.
 *
 * @param {Array} point - Il primo punto rappresentato come array di coordinate (es. [x, y, z]).
 * @param {Array} pointControl - Il secondo punto rappresentato come array di coordinate.
 *
 * @returns {boolean} Restituisce `true` se i due punti hanno le stesse coordinate, altrimenti `false`.
 */
function control_point(point, pointControl) {
    var riscontro = false; // Variabile per indicare se i punti sono identici

    // Confronta ogni coordinata dei due punti
    for (var cordinata = 0; cordinata < point.length; cordinata++) {
        if (point[cordinata] == pointControl[cordinata]) {
            riscontro = true; // Le coordinate corrispondono
        } else {
            return false; // Appena una coordinata non corrisponde, restituisce false
        }
    }

    return riscontro; // Se tutte le coordinate corrispondono, restituisce true
}


/**
 * Calcola il "Elbow Point" (punto di ginocchio) per determinare il numero ottimale di cluster
 * utilizzando il metodo SSE (Sum of Squared Errors) e genera un grafico per visualizzarlo.
 *
 * @param {Array} dataset - Il dataset su cui eseguire il clustering.
 * @param {number} min - Il valore minimo di k (numero di cluster da analizzare).
 * @param {number} max - Il valore massimo di k (numero di cluster da analizzare).
 * @returns {number} elbowPoint - Il valore ottimale di k (elbow point).
 */

function elbowPoint(dataset,min,max){

    let kmin=min; //valore minimo di k
    let kmax=max; //valore massi a cui puo arrivare k
    let sse=[]; //squared sum estimate

    for(k=kmin;k<=kmax;k++) { //Calcolo l'sse per ogni k
        clusterMaker.k(k);
        clusterMaker.iterations(100);
        clusterMaker.data(dataset);
        let cluster = clusterMaker.clusters();
        var distortions = 0;
        for (i = 0; i < k; i++)
            distortions = distortions + sommaDistanze(cluster[i].centroid, cluster[i].points);
        sse.push(distortions);
    }

    // Calcolo elbow point
    deltas = [];
    for (i = 1; i < sse.length - 1; i++){
        delta1 = Math.abs(sse[i] - sse[i-1]);
        delta2 = Math.abs(sse[i+1] - sse[i]);
        deltas.push(Math.abs(delta2-delta1));
    }
    const maximumDelta = Math.max(...deltas);
    const elbowPoint = deltas.indexOf(maximumDelta) + 1 + kmin; // Trust me

    //Inserisco in un array i valori di k per cui ho calcolato l'sse
    var cordinateX=[];
    for(k=0;k<kmax;k++)
        cordinateX[k]=kmin+k;

    //Generazione del grafico
    var trace1 = {
        x: cordinateX,
        y: sse,
        type: 'scatter'
    };
    var data = [trace1];
    var layout = {
        title: 'Elbow Point',
        xaxis: {
            title: 'Number of Clusters',
        },
        yaxis: {
            title: 'SSE',
        }
    };

    nodeplotlib.plot(data,layout);

    return elbowPoint;
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

/**
 * Funzione per generare un grafico 3D che visualizza i punti di ciascun cluster nello spazio.
 *
 * @param {Array} clusters - Array di oggetti cluster, dove ogni oggetto contiene i punti appartenenti al cluster.
 * @param {Array} datasetCluster - Dataset ridotto (ad esempio, PCA) utilizzato per il clustering.
 * @param {Array} datasetCompleto - Dataset completo contenente i dettagli delle canzoni.
 */
function grafico3D(clusters, datasetCluster, datasetCompleto) {

    var dataToBePlotted = []; // Array che conterrà i dati per la generazione del grafico 3D.
    var i = 0;

    let songs = []; // Array per memorizzare le informazioni sulle canzoni nei cluster.

    // Itera attraverso ogni cluster per estrarre e visualizzare i punti.
    while (i < clusters.length) {

        // Estrae le coordinate x, y, z per ogni punto nel cluster.
        const _x = extractColum(clusters[i].points, 0);
        const _y = extractColum(clusters[i].points, 1);
        const _z = extractColum(clusters[i].points, 2);

        // Ottiene i titoli e i generi delle canzoni appartenenti a questo cluster.
        const _title = researchTitleCluster(clusters[i].points, datasetCluster, datasetCompleto);
        const _genere = researchGenreCluster(clusters[i].points, datasetCluster, datasetCompleto);

        // Per ogni punto, crea un oggetto canzone con le informazioni pertinenti.
        for (let p = 0; p < _x.length; p++) {
            const song = {
                x: _x[p],
                y: _y[p],
                z: _z[p],
                title: _title[p],
                genere: _genere[p].trim()
            };
            songs.push(song); // Aggiungi la canzone all'array `songs`.
        }

        // Crea una traccia per il grafico 3D, rappresentando un cluster.
        let trace = {
            x: _x,
            y: _y,
            z: _z, // Coordinate dei punti del cluster nello spazio 3D.
            mode: 'markers', // Mostra i punti come marcatori.
            name: "Trace " + i + ": " + categorizzazioneCluster(clusters[i].points, datasetCluster, datasetCompleto),
            marker: {
                size: 5, // Dimensione dei marcatori per ogni punto.
                line: {
                    width: 0.1 // Spessore del bordo dei marcatori.
                },
                opacity: 1, // Opacità del marcatore.
            },
            text: _title, // Array di titoli delle canzoni per il mouseover.
            type: 'scatter3d' // Tipo di grafico (scatter 3D).
        };

        dataToBePlotted.push(trace); // Aggiungi la traccia al grafico finale.
        i = i + 1; // Passa al prossimo cluster.

    }

    // Definisce il layout del grafico.
    var layout = {
        title: 'K-Means generated clusters', // Titolo del grafico.
        legend: {
            "orientation": "h" // Imposta l'orientamento della legenda in orizzontale.
        }
    };

    // Visualizza il grafico 3D con i dati e il layout definiti.
    nodeplotlib.plot(dataToBePlotted, layout);
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
/**
 * Funzione che restituisce il genere di tutte le canzoni associate ai punti di un cluster.
 *
 * @param {Array} points - Un array di punti, ciascuno rappresentato come un array di 3 valori
 *                          (coordinata X, Y e Z) che definiscono la posizione nel cluster.
 * @param {Array} datasetPCA - Il dataset delle coordinate ottenute tramite PCA, utilizzato per
 *                              confrontare i punti del cluster.
 * @param {Array} datasetCompleto - Il dataset completo delle canzoni, che contiene le informazioni
 *                                   come il genere e il titolo delle canzoni.
 *
 * @returns {Array} Un array contenente i generi delle canzoni associate ai punti del cluster.
 */
function researchGenreCluster(points, datasetPCA, datasetCompleto) {
    var j = 0; // Inizializzazione dell'indice per iterare sui punti
    var genereSongs = []; // Array che conterrà i generi delle canzoni per ogni punto nel cluster

    // Itera su ogni punto del cluster
    do {
        var cordX = points[j][0]; // Estrai la coordinata X del punto
        var cordY = points[j][1]; // Estrai la coordinata Y del punto
        var cordZ = points[j][2]; // Estrai la coordinata Z del punto
        var genere = ''; // Variabile per accumulare il genere della canzone

        // Ciclo per confrontare il punto con tutti i punti nel dataset PCA
        for (i = 0; i < datasetPCA.length; i++) {
            // Se le coordinate del punto corrente corrispondono a quelle nel dataset PCA
            if (cordX == datasetPCA[i][0] && cordY == datasetPCA[i][1] && cordZ == datasetPCA[i][2]) {
                // Aggiungi il genere della canzone associata alla coordinata al genere corrente
                genere = genere + ' ' + datasetCompleto[i]['Top Genre'];
            }
        }

        // Aggiungi il genere trovate nell'array delle canzoni
        genereSongs.push(genere);
        j++; // Passa al prossimo punto nel cluster
    } while (j < points.length) // Continua fino a che non sono stati processati tutti i punti

    // Restituisce l'array dei generi delle canzoni
    return genereSongs;
}

/**
 * Funzione che restituisce il titolo delle canzoni di tutti i punti di un cluster.
 * Per ogni punto del cluster, cerca la corrispondenza nel dataset PCA e recupera il titolo della canzone associata.
 *
 * @param {Array} points - Array di punti appartenenti al cluster, ogni punto è rappresentato da un array di coordinate [x, y, z].
 * @param {Array} datasetPCA - Dataset ridotto contenente le coordinate [x, y, z] dei punti.
 * @param {Array} datasetCompleto - Dataset completo contenente le informazioni delle canzoni, inclusi i titoli.
 * @returns {Array} nameSongs - Array contenente i titoli delle canzoni corrispondenti ai punti del cluster.
 */
function researchTitleCluster(points, datasetPCA, datasetCompleto) {
    var j = 0; // Indice per scorrere i punti del cluster
    var nameSongs = []; // Array per memorizzare i titoli delle canzoni

    // Itera su tutti i punti del cluster
    do {
        // Estrai le coordinate (x, y, z) del punto
        var cordX = points[j][0];
        var cordY = points[j][1];
        var cordZ = points[j][2];
        var title = ''; // Variabile per raccogliere il titolo della canzone

        // Confronta le coordinate del punto con quelle nel dataset PCA
        for (i = 0; i < datasetPCA.length; i++) {
            // Se le coordinate corrispondono, aggiungi il titolo della canzone dal dataset completo
            if (cordX == datasetPCA[i][0] && cordY == datasetPCA[i][1] && cordZ == datasetPCA[i][2]) {
                title = title + ' ' + datasetCompleto[i].Title;
            }
        }

        // Aggiungi il titolo della canzone (o delle canzoni) all'array
        nameSongs.push(title);
        j++; // Passa al prossimo punto
    } while (j < points.length); // Continua fino a quando non sono stati elaborati tutti i punti

    return nameSongs; // Restituisce l'array con i titoli delle canzoni
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


/**
 * Calcola il valore medio di una feature in un array.
 *
 * @param {Array} array - L'array di dati in cui calcolare la media.
 * @param {string|undefined} [feature=undefined] - (Opzionale) La feature specifica da calcolare, se l'array contiene oggetti.
 *
 * @returns {number} Il valore medio della feature specificata o dei valori nell'array.
 */
function valoreMedio(array, feature = undefined) {
    let n = array.length; // Numero totale di elementi nell'array
    let sum = 0; // Somma dei valori validi

    // Itera su ogni elemento dell'array
    array.forEach((value) => {
        // Determina il valore da utilizzare (diretto o basato su una feature)
        const val = feature === undefined ? value : value[feature];

        // Aggiunge alla somma se il valore è valido (non vuoto o falsy)
        if (val !== "" && val !== undefined && val !== null) {
            sum += parseFloat(val); // Converte in float e somma
        } else {
            n--; // Riduce il conteggio se il valore non è valido
        }
    });

    return sum / n; // Calcola e restituisce la media
}



/**
 * Genera un grafico scatter per visualizzare il gomito in base alla varianza della PCA.
 *
 * @param {Array} gomito - Array contenente i valori dell'asse Y (valori del gomito).
 * @param {Array} varianza - Array contenente i valori dell'asse X (varianze).
 */
function graficoElbowPointByVarianza(gomito, varianza) {
    // Creazione del tracciato dati per il grafico
    var trace1 = {
        x: varianza, // Asse X: varianza
        y: gomito,   // Asse Y: gomito
        type: 'scatter' // Tipo di grafico: scatter
    };

    var data = [trace1]; // Insieme dei dati per il grafico

    // Layout del grafico
    var layout = {
        title: 'Gomito data la varianza della PCA', // Titolo del grafico
        xaxis: {
            title: 'Varianza' // Titolo asse X
        },
        yaxis: {
            title: 'Gomito' // Titolo asse Y
        }
    };

    // Generazione del grafico con NodePlotLib
    nodeplotlib.plot(data, layout);
}


/**
 * Funzione che genera un grafico che mostra la variazione del numero di punti in un cluster
 * in base alla varianza della PCA.
 *
 * @param {Array} numeroPunti - Array che contiene il numero di punti per cluster.
 * @param {Array} numeroCluster - Array che contiene il numero di cluster.
 * @param {Array} percentualVarianza - Array con le percentuali di varianza utilizzate.
 */
function graficoNumeroPuntiClusterByVarianza(numeroPunti, numeroCluster, percentualVarianza) {

    // Array per memorizzare i dati da tracciare nel grafico
    var data = [];

    // Iterazione per ogni percentuale di varianza
    var i = 0;
    while (i < percentualVarianza.length) {
        // Ogni traccia rappresenta una curva relativa a una percentuale di varianza
        var trace = {
            x: numeroCluster[i], // Ascissa: numero di cluster
            y: numeroPunti[i],   // Ordinata: numero di punti
            name: 'Percentual Varianza: ' + percentualVarianza[i], // Etichetta della curva
            type: 'scatter' // Tipo di grafico: scatter plot
        };

        // Aggiunge la traccia al dataset
        data.push(trace);
        i++;
    }

    // Configurazione del layout del grafico
    var layout = {
        title: 'Variazione numero punti di un cluster in base alla varianza della PCA', // Titolo del grafico
        xaxis: {
            title: 'Cluster', // Etichetta asse x
        },
        yaxis: {
            title: 'Numero Punti', // Etichetta asse y
        }
    };

    // Generazione del grafico con nodeplotlib
    nodeplotlib.plot(data, layout);
}


/*
 * Esporta le funzioni:
 */
exports.graficoNumeroPuntiClusterByVarianza=graficoNumeroPuntiClusterByVarianza;
exports.graficoElbowPointByVarianza=graficoElbowPointByVarianza;
exports.mainKMeans = main;
exports.grafico3D = grafico3D;
exports.graficoRadar = graficoRadar;
exports.makeHistograms = makeBarChart;
