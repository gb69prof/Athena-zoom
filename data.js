window.ATHENA_ZOOM_DATA = {
  title: "AthenaZoom",
  subtitle: "Prototipo: Foscolo come mappa narrativa",
  overview: { x: 2500, y: 1600, scale: 0.28, rotate: 0 },
  startNode: "centro",
  path: ["centro", "filosofia", "fratture", "mondo", "poetica", "opere", "eredita"],
  edges: [
    ["centro", "filosofia"],
    ["filosofia", "fratture"],
    ["fratture", "mondo"],
    ["mondo", "poetica"],
    ["poetica", "opere"],
    ["opere", "eredita"],
    ["mondo", "opere"],
    ["filosofia", "poetica"]
  ],
  nodes: [
    {
      id: "centro",
      type: "center",
      title: "Foscolo",
      subtitle: "Una lezione che non procede per slide, ma per attraversamenti.",
      icon: "🏛️",
      x: 2500,
      y: 1600,
      scale: 0.72,
      rotate: 0,
      kicker: "Nucleo della lezione",
      body: "Questa è la mappa generale. AthenaZoom serve a trasformare una lezione in uno spazio: ogni concetto ha un luogo, una distanza, un legame.\n\nUsa Avanti per seguire il percorso guidato, oppure clicca liberamente sui nodi.",
      actions: [{ label: "Apri percorso", target: "filosofia" }]
    },
    {
      id: "filosofia",
      title: "Filosofia base",
      subtitle: "Materia, ragione, limite, nulla dopo la morte.",
      icon: "⚙️",
      x: 1250,
      y: 830,
      scale: 0.95,
      rotate: -5,
      kicker: "Punto di partenza",
      body: "Prima di leggere Foscolo bisogna chiarire l'immagine del reale da cui parte: una visione materialistica, razionale, segnata dall'idea che l'uomo sia parte della natura e non suo padrone.\n\nDa qui nasce il problema: se tutto finisce, che cosa può salvare il senso dell'esistenza?"
    },
    {
      id: "fratture",
      title: "Fratture biografiche",
      subtitle: "Zante, Campoformio, esilio, lutti, patria perduta.",
      icon: "🕯️",
      x: 2650,
      y: 720,
      scale: 0.95,
      rotate: 2,
      kicker: "Vita che diventa visione",
      body: "Le fratture non sono semplici episodi. Sono punti di pressione: spezzano una continuità e obbligano l'autore a costruire una risposta.\n\nIn Foscolo la patria perduta, l'esilio, la morte del fratello e il disinganno politico diventano materia poetica. Non decorazione: struttura interiore."
    },
    {
      id: "mondo",
      title: "Immagine del mondo",
      subtitle: "L'universo-macchina e la religione delle illusioni.",
      icon: "🌌",
      x: 3880,
      y: 1500,
      scale: 0.9,
      rotate: 6,
      kicker: "Visione complessiva",
      body: "Il mondo foscoliano è dominato da forze naturali e storiche che non garantiscono giustizia. L'uomo è fragile, mortale, esposto al tempo.\n\nProprio per questo nascono le illusioni: patria, amore, bellezza, poesia, memoria. Non sono bugie consolatorie. Sono costruzioni umane che permettono di vivere dentro un universo che non promette salvezza."
    },
    {
      id: "poetica",
      title: "Poetica",
      subtitle: "Neoclassicismo e tensione preromantica.",
      icon: "✒️",
      x: 3020,
      y: 2440,
      scale: 0.95,
      rotate: -4,
      kicker: "Forma della risposta",
      body: "Foscolo cerca una forma alta, composta, classica. Ma dentro quella forma pulsa una materia inquieta: esilio, desiderio, morte, passione politica, perdita.\n\nQui sta la sua forza: non abbandona il caos, lo costringe a passare attraverso una forma."
    },
    {
      id: "opere",
      title: "Opere",
      subtitle: "Ortis, Sonetti, Sepolcri, Grazie.",
      icon: "📚",
      x: 1580,
      y: 2440,
      scale: 0.9,
      rotate: 4,
      kicker: "Concretizzazione",
      body: "Le opere non vanno lette come capitoli separati, ma come luoghi diversi della stessa tensione.\n\nNell'Ortis esplode il fallimento storico e privato. Nei Sonetti la biografia diventa mito personale. Nei Sepolcri la memoria diventa risposta civile. Nelle Grazie la bellezza tenta di educare la violenza umana."
    },
    {
      id: "eredita",
      title: "Eredità",
      subtitle: "Che cosa resta quando tutto passa?",
      icon: "🔥",
      x: 2460,
      y: 3020,
      scale: 0.86,
      rotate: 0,
      kicker: "Chiusura problematica",
      body: "Foscolo non dà una salvezza facile. Dice una cosa più dura e più umana: il senso non è garantito, va costruito.\n\nLa poesia, la memoria, gli affetti e la patria non cancellano la morte. Ma impediscono che l'uomo sia solo consumo, polvere, meccanismo."
    }
  ]
};
