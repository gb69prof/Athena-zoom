window.ATHENA_ZOOM_DATA = {
  version: "2.0",
  title: "AthenaZoom Desk",
  subtitle: "Costruisci percorsi, proietta mappe vive",
  world: { width: 5200, height: 3400 },
  theme: {
    background: "classico",
    accent: "#c99a48"
  },
  nodes: [
    {
      id: "centro",
      type: "text",
      title: "Foscolo",
      body: "Il percorso parte dal centro: l'autore non come elenco di date, ma come sistema di tensioni.\n\nIn modalità costruzione puoi spostare questa scheda, modificarla, collegarla ad altre e aggiungere immagini, PDF, documenti o link.",
      x: 2500,
      y: 1650,
      w: 460,
      h: 230,
      color: "#f3d58a",
      icon: "Φ"
    },
    {
      id: "filosofia",
      type: "text",
      title: "1 · Filosofia base",
      body: "Materialismo, meccanicismo, assenza di provvidenza. L'uomo vive in un universo che non consola.",
      x: 1500,
      y: 820,
      w: 360,
      h: 190,
      color: "#f6ead0",
      icon: "⚙"
    },
    {
      id: "fratture",
      type: "text",
      title: "2 · Fratture",
      body: "Campoformio, esilio, sradicamento, morte del fratello. La biografia diventa forma mentale.",
      x: 3300,
      y: 790,
      w: 360,
      h: 190,
      color: "#f1c6a6",
      icon: "⌁"
    },
    {
      id: "mondo",
      type: "text",
      title: "3 · Immagine del mondo",
      body: "Il mondo è macchina. Le illusioni non sono bugie: sono difese vitali contro il nulla.",
      x: 3650,
      y: 2070,
      w: 390,
      h: 200,
      color: "#d7e6c3",
      icon: "☉"
    },
    {
      id: "opere",
      type: "link",
      title: "4 · Opere",
      body: "Da Ortis ai Sepolcri: la visione diventa scrittura.",
      url: "https://it.wikipedia.org/wiki/Ugo_Foscolo",
      x: 1500,
      y: 2200,
      w: 390,
      h: 200,
      color: "#c9ddf0",
      icon: "✦"
    }
  ],
  edges: [
    { id: "e1", from: "centro", to: "filosofia", color: "#d6aa4d", width: 8, style: "solid", label: "base" },
    { id: "e2", from: "centro", to: "fratture", color: "#b56a42", width: 5, style: "solid", label: "vita" },
    { id: "e3", from: "fratture", to: "mondo", color: "#6c8f59", width: 4, style: "dashed", label: "trasformazione" },
    { id: "e4", from: "mondo", to: "opere", color: "#4d82ad", width: 6, style: "solid", label: "scrittura" },
    { id: "e5", from: "filosofia", to: "mondo", color: "#8b6cbb", width: 3, style: "dotted", label: "visione" }
  ],
  path: ["centro", "filosofia", "fratture", "mondo", "opere"]
};
