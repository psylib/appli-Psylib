// Les 10 cartes citations PsyLib (reprises de docs/marketing/visuals/library.html)
// mark: 'bgq' (guillemet géant en fond) | 'bigmark' (guillemet centré au-dessus) | 'none'
// bar:  'top' (barre d'accent au-dessus de la citation) | 'bottom' (en dessous, style violet)
// blobs: nombre de halos colorés (1 ou 2)
// Highlight dans une ligne : entourer d'astérisques  *texte*
export const CARDS = [
  { id: '01', style: 'indigo', mark: 'bgq', blobs: 2, bar: 'top',
    lines: ["Aller voir un psychologue,", "ce n'est pas attendre", "d'aller mal.", "C'est choisir *d'aller mieux.*"],
    tagline: "Votre santé mentale mérite de l'attention." },

  { id: '02', style: 'light', mark: 'none', blobs: 2, bar: 'top',
    lines: ["Vos émotions ne sont pas", "des problèmes à résoudre,", "mais des messages", "*à écouter.*"],
    tagline: "Et si on apprenait à les entendre ?" },

  { id: '03', style: 'teal', mark: 'bgq', blobs: 1, bar: 'top',
    lines: ["Demander de l'aide,", "ce n'est pas un aveu", "de faiblesse.", "C'est un acte de *courage.*"],
    tagline: "Faire le premier pas, c'est déjà avancer." },

  { id: '04', style: 'violet', mark: 'bigmark', blobs: 2, bar: 'bottom',
    lines: ["Il n'y a pas de bon moment", "pour consulter.", "Il y a juste *le vôtre.*"],
    tagline: "Prenez soin de vous, à votre rythme." },

  { id: '05', style: 'indigo', mark: 'bgq', blobs: 2, bar: 'top',
    lines: ["Prendre soin de sa tête,", "c'est aussi prendre soin", "*de sa vie.*"],
    tagline: "La santé mentale, ça se cultive." },

  { id: '06', style: 'light', mark: 'none', blobs: 2, bar: 'top',
    lines: ["On a le droit", "de ne pas aller bien.", "Et le droit *d'en parler.*"],
    tagline: "Briser le silence, c'est déjà se soigner." },

  { id: '07', style: 'teal', mark: 'bgq', blobs: 1, bar: 'top',
    lines: ["Mettre des mots", "sur ses maux,", "c'est déjà commencer", "*à se libérer.*"],
    tagline: "La parole soigne." },

  { id: '08', style: 'violet', mark: 'bigmark', blobs: 2, bar: 'bottom',
    lines: ["Le courage, ce n'est pas", "de tout porter seul.", "C'est d'oser être *accompagné.*"],
    tagline: "Vous n'avez pas à le faire seul·e." },

  { id: '09', style: 'indigo', mark: 'bgq', blobs: 2, bar: 'top',
    lines: ["Votre santé mentale", "n'est pas un luxe.", "C'est une *priorité.*"],
    tagline: "Accordez-vous ce que vous méritez." },

  { id: '10', style: 'light', mark: 'none', blobs: 2, bar: 'top',
    lines: ["Guérir, ce n'est pas oublier.", "C'est apprendre", "à *avancer avec.*"],
    tagline: "Un pas après l'autre." },
];
