# MelodyMind
MelodyMind è un progetto realizzato da Vincenzo Medica per il corso di Fondamenti di Intelligenza Artificiale.

## Obiettivo del progetto
L'obiettivo principale del progetto è quello di clusterizzare una libreria musicale, suddividendola in diverse playlist. Ogni playlist contiene brani "simili" in base a specifiche caratteristiche sonore.

## Documentazione
Per comprendere meglio il progetto MelodyMind, sono disponibili i seguenti materiali:
- [Presentazione del progetto](./Documenti/MelodyMind_presentation_medica.pdf): Fornisce una panoramica generale del progetto e dei suoi obiettivi.
- [Report di progetto](./Documenti/MelodyMind_report_medica.pdf): Contiene i dettagli approfonditi sulle diverse fasi del processo, inclusi gli algoritmi e le scelte progettuali.

## Prerequisiti
Il progetto richiede l'installazione di [NodeJS](https://nodejs.org/it/) e del package manager [npm](https://www.npmjs.com/).

Dopo aver installato NodeJS, posizionarsi nella directory principale del progetto ed eseguire il comando:

```
npm install
```

per installare tutte le dipendenze necessarie.

## Utilizzo
Il progetto può essere eseguito utilizzando il dataset fornito di default, ma prima di procedere, assicurarsi di installare tutte le librerie richieste. 

Per avviare il progetto con il dataset di default, utilizzare il comando:



```
node app.js
```


Il processo prevede l'avvio delle seguenti operazioni: standardizzazione dei dati, analisi delle componenti principali, riduzione della dimensionalità e clustering. Verranno generati grafici relativi ai risultati di entrambi gli algoritmi di clustering, visualizzabili direttamente nel browser. Inoltre, la console mostrerà le playlist create utilizzando l'algoritmo di clustering k-means. I grafici prodotti corrisponderanno a quelli descritti nel report.
