import type { MarketGuides } from "../guides-types"

export const guides: MarketGuides = {
  base: "guida",
  label: "Guide",
  guides: [
    {
      slug: "come-farsi-consigliare-da-chatgpt",
      title: "Come farsi consigliare da ChatGPT: guida per attività",
      description:
        "Guida pratica per attività locali in Italia: cosa leggono ChatGPT, Gemini, Claude e Perplexity prima di consigliarti e cosa sistemare, passo per passo.",
      h1: "Come far consigliare la tua attività da ChatGPT, Gemini, Claude e Perplexity",
      answer:
        "Per farti consigliare da ChatGPT e dalle altre IA devi rendere facile capire chi sei, cosa fai e dove: profilo Google completo e uguale ovunque, recensioni recenti con risposta, presenza sui portali del tuo settore, pagine dei servizi chiare con risposte alle domande vere dei clienti e dati strutturati sul sito. Poi controlli ogni mese cosa rispondono le IA.",
      takeaways: [
        "Le IA consigliano le attività che trovano descritte in modo chiaro e coerente su più fonti: il tuo sito da solo non basta.",
        "Nome, indirizzo, telefono e categoria devono essere identici su Google, PagineGialle, portali di settore e sito.",
        "Le pagine che vengono citate rispondono a domande precise, scritte come le scrive un cliente: “un idraulico a Torino che viene anche il sabato?”.",
        "Prima di cambiare qualsiasi cosa, chiedi tu stesso alle quattro IA chi consigliano nella tua città e prendi nota.",
      ],
      sections: [
        {
          h2: "Cosa succede quando un cliente chiede “chi mi consigli?” all’IA",
          paragraphs: [
            "Fino a poco tempo fa chi cercava un dentista a Bologna o un elettricista a Bari scriveva due parole su Google e scorreva una pagina di link. Oggi sempre più persone fanno la domanda intera a ChatGPT, a Gemini, a Claude o a Perplexity: “mi consigli un dentista bravo a Bologna, zona Santo Stefano, che faccia anche impianti?”. La differenza è enorme. Invece di dieci link arriva una risposta con due, tre, al massimo cinque nomi. Se il tuo non c’è, quel cliente non ti vedrà proprio.",
            "Le IA non si inventano i nomi a caso. Quando possono cercare sul web (ChatGPT con la ricerca attiva, Perplexity quasi sempre, Gemini attingendo all’ecosistema Google), leggono pagine, schede e recensioni in tempo reale. Quando rispondono a memoria, usano quello che hanno imparato da ciò che era pubblico sul web. In entrambi i casi il materiale è lo stesso: quello che si dice di te online, su quali siti e con quanta coerenza.",
            "La buona notizia è che quasi tutto questo materiale lo puoi controllare o almeno influenzare. Questo lavoro ha un nome tecnico, AEO (Answer Engine Optimization, cioè ottimizzazione per i motori di risposta), ma nella pratica è una serie di cose molto concrete. Eccole, nell’ordine in cui le farei io.",
          ],
        },
        {
          h2: "Passo 1: chiedi tu alle IA cosa dicono oggi",
          paragraphs: [
            "Prima di toccare qualsiasi cosa, fotografa la situazione. Apri ChatGPT, Gemini, Claude e Perplexity e fai le domande che farebbe un tuo cliente, in italiano e con la tua città. Non “migliore studio legale Italia”, ma come parla la gente: “avvocato divorzista a Padova che risponda in fretta”, “un centro estetico a Monza per la laminazione ciglia”, “trattoria a Trastevere dove non si spenda una follia”.",
            "Annota per ogni IA chi viene nominato, con quali motivazioni e da quali siti sembra prendere le informazioni (Perplexity mostra le fonti, ChatGPT spesso anche). Chiedi poi direttamente: “cosa sai di [nome della tua attività] a [città]?”. Capita spesso di scoprire orari vecchi, un indirizzo di prima del trasloco o servizi che non fai più.",
          ],
          bullets: [
            "3–5 domande per servizio principale, scritte come le scriverebbe un cliente",
            "Sempre con la città o il quartiere (“a Napoli, al Vomero”)",
            "Una domanda diretta sul tuo nome, per vedere cosa sa l’IA di te",
            "Ripeti lo stesso elenco ogni mese, così vedi se qualcosa cambia",
          ],
        },
        {
          h2: "Passo 2: sistema il Profilo dell’attività su Google",
          paragraphs: [
            "Il Profilo dell’attività su Google (quello che una volta si chiamava Google My Business) è la scheda che compare su Google Maps. Per Gemini è una fonte diretta, e anche le altre IA leggono spesso le stesse informazioni riprese da altri siti. È il primo posto da sistemare.",
            "Controlla che la categoria principale sia quella giusta e il più precisa possibile: “Dentista” o “Studio di implantologia dentale”, non un generico “Servizi sanitari”. Aggiungi le categorie secondarie pertinenti, l’elenco dei servizi con una breve descrizione, gli orari veri (anche quelli festivi: a Ferragosto e nei ponti molti dimenticano di aggiornarli), la zona servita se vai a domicilio, foto reali del locale e del lavoro. Pubblica un aggiornamento ogni settimana o due: un lavoro finito, una novità, un consiglio stagionale. Un profilo vivo dice all’IA che l’attività è aperta e attiva.",
          ],
        },
        {
          h2: "Passo 3: rendi i tuoi dati identici ovunque",
          paragraphs: [
            "Le IA incrociano le fonti. Se su Google risulti in via Roma 12, su PagineGialle ancora in corso Garibaldi e sul sito c’è un numero fisso che non risponde più, l’IA non sa di chi fidarsi e tende a nominare qualcun altro, più facile da verificare.",
            "Scegli una versione “ufficiale” di nome, indirizzo, telefono, sito e categoria e riportala identica dappertutto: Profilo Google, PagineGialle, Apple Maps (tramite Apple Business Connect), Bing Places, Facebook, Instagram e i portali del tuo settore. Attenzione alle piccole differenze: “Studio Dentistico Rossi” e “Rossi Dr. Marco Odontoiatra” per una macchina possono sembrare due attività diverse. Ricordati anche che in Italia il sito di un’impresa deve riportare la partita IVA: mettila nel piè di pagina insieme a ragione sociale e indirizzo, è anche un segnale di serietà.",
          ],
        },
        {
          h2: "Passo 4: recensioni recenti, e rispondi a tutte",
          paragraphs: [
            "Quando un’IA spiega perché consiglia qualcuno, cita quasi sempre le recensioni: “molto apprezzato per la puntualità”, “i clienti lodano la gentilezza dello staff”. Contano il numero, ma soprattutto la freschezza e il contenuto. Venti recensioni di quest’anno che parlano di “impianto”, “urgenza il sabato” e “preventivo chiaro” valgono più di cento recensioni generiche del 2019.",
            "Chiedi la recensione a ogni cliente soddisfatto, subito dopo il lavoro, con un link diretto via WhatsApp. Rispondi a tutte, positive e negative, in modo personale e specifico. Non comprare recensioni e non scriverle tu: oltre a essere vietato dalle regole europee e italiane sulle pratiche commerciali scorrette, le piattaforme le individuano e le rimuovono, e un profilo ripulito all’improvviso è un pessimo segnale.",
          ],
        },
        {
          h2: "Passo 5: sul sito, pagine che rispondono alle domande vere",
          paragraphs: [
            "Le IA citano volentieri le pagine che rispondono a una domanda in modo diretto, nelle prime righe. Una home con scritto “Professionalità e passione dal 1985” non dice niente; una pagina intitolata “Impianti dentali a Bologna: quanto dura il trattamento e cosa aspettarsi” sì.",
            "Crea una pagina per ogni servizio importante e, se lavori su più zone, indica chiaramente quali (“interveniamo a Milano, Sesto San Giovanni e Cinisello”). In ogni pagina metti una sezione di domande frequenti con le domande che ti fanno al telefono, risposte brevi e concrete. Se sei medico, dentista o avvocato ricordati che in Italia la comunicazione sanitaria e quella forense devono restare informative: niente promesse di risultato, niente sconti urlati. Per fortuna è proprio il tono che le IA preferiscono citare.",
          ],
          bullets: [
            "Una pagina per servizio, con città o zona nel titolo",
            "La risposta alla domanda nelle prime due righe, poi i dettagli",
            "Domande frequenti scritte come le chiedono i clienti, non come le direbbe un ufficio marketing",
            "Nome del titolare o del professionista, iscrizione all’albo se c’è, anni di attività",
          ],
        },
        {
          h2: "Passo 6: dati strutturati e accesso per le IA",
          paragraphs: [
            "I dati strutturati (in inglese schema markup) sono un piccolo blocco di codice invisibile ai visitatori che dice alle macchine, in modo inequivocabile: questa è un’attività locale, si chiama così, è in questa via, apre a quest’ora, offre questi servizi. Il tipo più usato è LocalBusiness, con varianti come Dentist, Attorney, Plumber o Restaurant. Se il sito è su WordPress, plugin come Yoast o Rank Math permettono di impostarli senza scrivere codice; altrimenti chiedi al tuo webmaster.",
            "Controlla anche che il sito non blocchi i sistemi delle IA. Nel file robots.txt a volte, per prudenza o per errore, vengono esclusi i programmi che OpenAI, Anthropic, Perplexity o Google usano per leggere il web. Se sono bloccati, quelle IA non possono leggere il tuo sito quando cercano informazioni. È una verifica di cinque minuti per chi gestisce il sito.",
          ],
        },
        {
          h2: "Passo 7: ricontrolla ogni mese",
          paragraphs: [
            "Questo non è un lavoro che si fa una volta e basta. Le risposte delle IA cambiano, i concorrenti pubblicano, le recensioni invecchiano. Ripeti ogni mese le stesse domande del passo 1 e confronta: sei comparso? In quale IA? Con quale motivazione? Spesso le IA che cercano in tempo reale, come Perplexity, reagiscono prima; quelle che rispondono a memoria ci mettono di più.",
            "Se vuoi un punto di partenza senza fare tutto a mano, il controllo gratuito su alphaa.app/it fa le domande dei tuoi clienti alle quattro IA, in italiano, e ti mostra in circa 60 secondi chi viene nominato e cosa manca. Alphaa è un agente IA che poi può fare il lavoro di questa guida al posto tuo, con il tuo ok su ogni modifica. Ma tutti i passi qui sopra li puoi fare anche da solo, un pomeriggio alla volta.",
          ],
        },
      ],
      faq: [
        {
          q: "Si può pagare ChatGPT per essere consigliati?",
          a: "No, non esiste un modo per comprare un posto nelle risposte normali di ChatGPT, Gemini, Claude o Perplexity. Si può solo rendere più chiare e coerenti le informazioni che leggono su di te.",
        },
        {
          q: "Quanto tempo ci vuole per vedere risultati?",
          a: "Dipende dall’IA e dal punto di partenza. Le IA che cercano sul web in tempo reale possono notare le modifiche in poche settimane, quelle che rispondono a memoria anche molto di più. Per questo conviene controllare ogni mese.",
        },
        {
          q: "Serve un sito per farsi consigliare dall’IA?",
          a: "Aiuta molto. Un’attività con solo il profilo Google può comparire, ma un sito con pagine chiare per ogni servizio dà all’IA molto più materiale da citare e da verificare.",
        },
        {
          q: "La SEO classica serve ancora?",
          a: "Sì. Gran parte del lavoro coincide: profilo Google curato, recensioni, pagine chiare. L’AEO aggiunge l’attenzione a rispondere a domande precise e alla coerenza dei dati su tutti i siti che le IA leggono.",
        },
      ],
      date: "2026-10-30",
    },
    {
      slug: "siti-che-legge-intelligenza-artificiale-attivita-locali",
      title: "Quali siti legge l’IA sulle attività locali in Italia",
      description:
        "Profilo Google, PagineGialle, MioDottore, TripAdvisor, ProntoPro, Treatwell, albi: i siti che l’IA legge sulla tua attività e come sistemare ciascuno.",
      h1: "Quali siti legge l’IA sulla tua attività in Italia, e come sistemarli uno per uno",
      answer:
        "In Italia ChatGPT, Gemini, Claude e Perplexity si informano sulle attività locali soprattutto dal Profilo dell’attività su Google, da PagineGialle, dai portali di settore come MioDottore, TripAdvisor, Treatwell, ProntoPro e Instapro, da Trustpilot e dagli albi professionali. Su ciascuno servono dati identici, categoria precisa, descrizione chiara dei servizi e recensioni recenti con risposta.",
      takeaways: [
        "L’IA si fida di quello che trova confermato su più siti indipendenti, non di quello che scrivi solo sul tuo.",
        "Il Profilo dell’attività su Google è la base per tutti; poi contano i portali del tuo settore.",
        "Per medici, dentisti, avvocati e professionisti l’iscrizione all’albo è una prova che l’IA può verificare.",
        "Meglio tre schede complete e aggiornate che quindici abbandonate con dati vecchi.",
      ],
      sections: [
        {
          h2: "Perché contano i siti degli altri",
          paragraphs: [
            "Quando chiedi a Perplexity “un buon fisioterapista a Verona?”, sotto la risposta compaiono le fonti: schede Google, portali sanitari, a volte articoli di giornali locali o forum. ChatGPT con la ricerca attiva fa qualcosa di simile, e Gemini attinge direttamente all’ecosistema Google. Anche quando un’IA risponde a memoria, quello che “sa” di un’attività viene da ciò che era scritto su questi stessi siti.",
            "Il motivo è semplice: un’IA non può venire a vedere il tuo negozio. Per decidere se consigliarti cerca conferme indipendenti. Se il tuo nome, la tua via e i tuoi servizi compaiono uguali su più siti autorevoli, con recensioni recenti, sei un nome sicuro da fare. Se le informazioni sono poche o contraddittorie, l’IA preferisce qualcun altro.",
            "Ecco i siti che pesano di più in Italia per le attività locali, con cosa sistemare su ciascuno. Non devi essere ovunque: concentrati su Google, PagineGialle e i due o tre portali del tuo settore.",
          ],
        },
        {
          h2: "Profilo dell’attività su Google",
          paragraphs: [
            "È la scheda che compare su Google Maps e nella ricerca, e per quasi tutte le attività locali è la fonte più importante. Gemini la usa direttamente; le altre IA leggono spesso le stesse informazioni riportate altrove.",
          ],
          bullets: [
            "Rivendica e verifica la scheda, se non l’hai già fatto, da business.google.com",
            "Categoria principale precisa (“Idraulico”, “Avvocato divorzista”), più le secondarie pertinenti",
            "Servizi elencati uno per uno, con una riga di descrizione",
            "Orari aggiornati, compresi festivi e chiusure estive",
            "Foto vere, recenti, del locale, del team e dei lavori",
            "Un post ogni una o due settimane e risposta a ogni recensione",
            "Nella sezione domande e risposte, se disponibile, le domande che ti fanno davvero",
          ],
        },
        {
          h2: "PagineGialle e gli elenchi generalisti",
          paragraphs: [
            "PagineGialle è l’elenco storico delle attività italiane e molte schede esistono da anni, spesso create in automatico e mai controllate. È proprio per questo che va verificata: un vecchio numero o un indirizzo di prima del trasloco può finire nelle risposte delle IA. Cerca la tua attività, rivendica la scheda gratuita e allinea nome, indirizzo, telefono, sito e categoria a quelli del Profilo Google. Non serve acquistare pacchetti pubblicitari per avere dati corretti.",
            "Già che ci sei, fai lo stesso con Bing Places (Bing è una delle fonti di ricerca usate da ChatGPT), Apple Business Connect per Apple Maps e la pagina Facebook, che per molte attività di quartiere è ancora una fonte letta e citata.",
          ],
        },
        {
          h2: "MioDottore, per medici, dentisti e professioni sanitarie",
          paragraphs: [
            "Per chi lavora nella sanità privata, MioDottore è il portale di riferimento in Italia: schede dei professionisti, prenotazioni e recensioni dei pazienti. Quando un’IA risponde a “un ortopedico bravo a Firenze per il ginocchio”, schede come queste offrono proprio quello che cerca: specializzazione, sede, prestazioni e opinioni.",
            "Completa la scheda con specializzazioni e prestazioni precise (“impianti dentali”, “ortodonzia invisibile”, non solo “odontoiatria”), tutte le sedi in cui ricevi, lingue parlate e una biografia breve con formazione e iscrizione all’albo. Invita i pazienti a lasciare un’opinione dopo la visita e rispondi con il tono sobrio che richiede il codice deontologico: niente dati clinici nelle risposte, mai.",
          ],
        },
        {
          h2: "TripAdvisor e Trustpilot",
          paragraphs: [
            "Per ristoranti, bar, hotel, B&B e attività turistiche TripAdvisor resta una delle fonti più citate quando qualcuno chiede “dove mangiare a Lecce” o “un agriturismo in Val d’Orcia”. Rivendica la scheda (è gratuito), aggiungi fasce di prezzo, tipo di cucina, opzioni senza glutine o vegane, orari, foto attuali, e rispondi alle recensioni, soprattutto a quelle critiche, con calma e nel merito.",
            "Trustpilot conta di più per chi vende online o lavora su tutto il territorio nazionale (e-commerce, servizi a distanza, assicurazioni, traslochi). Se i tuoi clienti lo usano, rivendica la pagina, collega il sito e chiedi le recensioni con gli inviti ufficiali della piattaforma, non con scorciatoie: Trustpilot segnala pubblicamente i profili che violano le sue regole.",
          ],
        },
        {
          h2: "ProntoPro, Instapro e Treatwell",
          paragraphs: [
            "Per artigiani e servizi a domicilio (idraulici, elettricisti, imbianchini, traslocatori, ma anche fotografi o personal trainer) ProntoPro e Instapro sono i portali dove i clienti chiedono preventivi e lasciano recensioni. Anche se non ti arrivano molti lavori da lì, una scheda completa con zona servita, servizi, foto dei lavori e qualche recensione è una conferma in più che l’IA può trovare.",
            "Treatwell è il riferimento per parrucchieri, centri estetici, barbieri e spa. Elenca i trattamenti con nomi chiari e durata (“balayage”, “laminazione ciglia”, “pressoterapia”), tieni aggiornati orari e operatori e spingi le clienti a recensire dopo l’appuntamento. Sono proprio questi nomi di trattamento che compaiono nelle domande alle IA.",
          ],
          bullets: [
            "Stesso nome, indirizzo e telefono del Profilo Google",
            "Zona servita scritta con i nomi dei comuni o dei quartieri",
            "Foto dei lavori fatti, non immagini di repertorio",
            "Rispondere alle recensioni anche qui, non solo su Google",
          ],
        },
        {
          h2: "Albi professionali e registri ufficiali",
          paragraphs: [
            "Per medici e odontoiatri (albi degli Ordini provinciali dei Medici Chirurghi e degli Odontoiatri, consultabili anche tramite la FNOMCeO), avvocati (albi dei Consigli dell’Ordine), ingegneri, architetti, commercialisti, psicologi e altre professioni ordinistiche, l’iscrizione all’albo è una fonte ufficiale che conferma nome, titolo e sede. Non puoi “ottimizzarla”, ma puoi fare in modo che sia coerente: verifica che i dati siano aggiornati, comunica all’Ordine eventuali cambi di indirizzo e cita l’iscrizione (Ordine e numero) sul tuo sito.",
            "Lo stesso vale per le imprese: il registro della Camera di Commercio e la partita IVA in fondo al sito sono elementi che collegano la tua attività a un’identità verificabile. Per un’IA che deve decidere di chi fidarsi, questi collegamenti contano.",
          ],
        },
        {
          h2: "Come procedere senza perderci settimane",
          paragraphs: [
            "Fai una tabella con tre colonne: sito, link alla tua scheda, dati da correggere. Parti dal Profilo Google, poi PagineGialle, poi i due o tre portali del tuo settore. Dedica un’ora a settimana: in un mese hai sistemato quasi tutto. Ogni volta che cambi orari, telefono o indirizzo, aggiorna tutte le righe della tabella lo stesso giorno.",
            "Per vedere quali di questi siti le IA stanno davvero usando quando parlano della tua categoria nella tua città, puoi fare il controllo gratuito su alphaa.app/it: chiede alle quattro IA, in italiano, chi consigliano e ti mostra dove sei e dove manchi. Da lì decidi tu se sistemare le cose da solo o lasciare che sia l’agente IA di Alphaa a farlo, con la tua approvazione.",
          ],
        },
      ],
      faq: [
        {
          q: "Devo pagare i portali per comparire nelle risposte delle IA?",
          a: "No. Le schede di base su Google, PagineGialle, TripAdvisor e la maggior parte dei portali sono gratuite. Quello che conta per le IA sono dati corretti, completi e recensioni recenti, non la pubblicità.",
        },
        {
          q: "Quale portale conta di più per il mio settore?",
          a: "Fai la prova: chiedi a Perplexity un consiglio sulla tua categoria nella tua città e guarda le fonti che cita. I siti che compaiono lì sono quelli su cui concentrarti per primi.",
        },
        {
          q: "Cosa faccio con le schede duplicate o vecchie?",
          a: "Rivendicale e correggile, oppure chiedi la chiusura o l’unione dei duplicati alla piattaforma. Una scheda con dati vecchi confonde l’IA più di una scheda mancante.",
        },
        {
          q: "Le recensioni su Facebook contano?",
          a: "Possono contare, soprattutto per attività di quartiere, ma Google e i portali di settore sono di solito fonti più citate. Meglio curare bene quelle prima di disperdersi.",
        },
      ],
      date: "2026-10-30",
    },
  ],
}
