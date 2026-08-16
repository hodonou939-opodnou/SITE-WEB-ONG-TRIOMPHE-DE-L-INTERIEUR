// Contenu centralisé du site. Les champs marqués [PLACEHOLDER] doivent être
// remplacés par l'ONG avant mise en ligne. Le reste provient d'informations
// fournies directement par l'ONG ou de recherches publiques (presse, ex.
// leconomistebenin.bj) sur l'ONG et le CIGIBM.

export const siteConfig = {
  name: "ONG Triomphe de l'Intérieur",
  shortName: "ONG Triomphe de l'Intérieur",
  tagline: "Guérir de l'intérieur pour triompher à l'extérieur",
  description:
    "ONG béninoise dédiée au bien-être mental, à la guérison intérieure et au développement personnel.",
  // Accroche émotionnelle du hero d'accueil — distincte de la description
  // factuelle ci-dessus, utilisée pour les meta-tags.
  homeHeroLede:
    "Certaines blessures ne se voient pas. On les porte en silence, on fait bonne figure, et on finit par croire que c'est normal. Depuis six ans, nous ouvrons des espaces où la parole se libère enfin — et où l'équilibre redevient possible.",
  founder: "Christelle Eugénie Gnimassou",
  founderTitle: "Présidente-fondatrice & coach",
  location: "Godomey, Abomey-Calavi, Bénin", // [PLACEHOLDER] adresse précise à confirmer
  email: "ongtriomphedelinterieur@gmail.com",
  phone: "01 68 28 06 75",
  phoneHref: "tel:+2290168280675",
  social: {
    facebook: "https://www.facebook.com/share/1D4sEtaPUN/?mibextid=wwXIfr",
    instagram: "#", // [PLACEHOLDER]
    tiktok: "#", // [PLACEHOLDER]
    linkedin: "#", // [PLACEHOLDER]
  },
};

// Brevo — le site étant en export statique (aucun backend), le formulaire
// d'inscription poste directement vers l'endpoint du formulaire Brevo, qui
// redirige ensuite le navigateur vers /cigibm-2026/merci.
//
// [PLACEHOLDER] Pour obtenir formAction :
//   1. Brevo > Contacts > Formulaires > Créer un formulaire d'inscription
//   2. Ajouter les champs PRENOM, SMS (téléphone) et EMAIL à la liste voulue
//   3. Onglet « Après la validation » > activer la redirection vers
//      https://<domaine>/cigibm-2026/merci
//   4. Partager > Copier le code HTML : l'URL du <form action="..."> est de la
//      forme https://<id-compte>.sibforms.com/serve/<id-formulaire>
//   5. Vérifier que les noms d'attributs ci-dessous correspondent à ceux du
//      code copié (ils dépendent des attributs de contact de votre compte).
export const brevo = {
  formAction: "https://PLACEHOLDER.sibforms.com/serve/PLACEHOLDER",
  fields: {
    firstName: "PRENOM",
    email: "EMAIL",
    phone: "SMS",
  },
};

export const navigation = [
  { label: "Accueil", href: "/" },
  { label: "Notre histoire", href: "/a-propos" },
  { label: "Méthode R.A.C.I.N.E.S.", href: "/methode-racines" },
  { label: "CIGIBM", href: "/cigibm" },
  { label: "Nous soutenir", href: "/nous-soutenir" },
  { label: "Contact", href: "/contact" },
];

export const presidentQuote = {
  quote:
    "Peu importe qui vous êtes... il n'y a personne d'assez solide pour ne jamais tomber face aux épreuves et au déséquilibre émotionnel.",
  author: "Christelle Eugénie Gnimassou",
  role: "Présidente-fondatrice, Triomphe de l'Intérieur",
};

// Mentions presse — chaque lien a été vérifié individuellement (contenu +
// URL) avant d'être ajouté ici. Ne pas ajouter d'URL non vérifiée.
export const pressMentions = [
  {
    outlet: "Matin Libre",
    title:
      "Congrès international de guérison intérieure et du bien-être mental : la 3ème édition s'annonce sous le sceau de l'équilibre",
    date: "13 novembre 2025",
    excerpt:
      "Annonce de la 3ème édition du CIGIBM au Palais des Congrès de Cotonou, réunissant experts internationaux, professionnels de la santé mentale et chercheurs autour de la guérison et du bien-être mental.",
    url: "https://matinlibre.com/2025/11/13/congres-international-de-guerison-interieure-et-du-bien-etre-mental-la-3eme-edition-sannonce-sous-le-sceau-de-lequilibre/",
  },
  {
    outlet: "L'Économiste du Bénin",
    title: "L'ONG Triomphe de l'Intérieur sensibilise sur l'équilibre",
    date: "2 décembre 2025",
    excerpt:
      "Retour sur la 3ème édition du CIGIBM, les 29 et 30 novembre 2025, consacrée à aider les participants à retrouver leur équilibre émotionnel.",
    url: "https://leconomistebenin.bj/long-triomphe-de-linterieur-sensibilise-sur-lequilibre/",
  },
  {
    outlet: "Economia24",
    title: "CIGIBM 2025 : Christelle Gnimassou pour le bien-être mental de tous",
    date: "30 novembre 2025",
    excerpt:
      "Compte-rendu de l'édition 2025, qui a réuni des centaines de participants autour d'outils concrets pour sortir de la « prison émotionnelle et sentimentale ».",
    url: "https://economia24.bj/2025/11/30/cigibm-2025-christelle-gnimassou-pour-le-bien-etre-mental-de-tous/",
  },
  {
    outlet: "Chaire UNESCO Éducation & Santé",
    title:
      "Christelle Eugénie Gnimassou, intervenante au 6ème Global Community Health Workshop",
    date: "juin 2026",
    excerpt:
      "La présidente-fondatrice de Triomphe de l'Intérieur intervient aux côtés d'experts internationaux lors de ce workshop consacré à la santé communautaire mondiale.",
    url: "https://didier-jourdan.com/fr/2026/06/",
  },
];

export const missionPillars = [
  {
    title: "Actions humanitaires",
    description:
      "Derrière chaque geste, un visage : celui d'un orphelin, d'une veuve, d'un enfant en difficulté. Nous agissons là où l'urgence ne peut pas attendre.",
  },
  {
    title: "Guérison intérieure & bien-être mental",
    description:
      "Une blessure qu'on ne nomme pas ne guérit pas. Nous créons les espaces — écoute, ateliers, accompagnement — où elle peut enfin se dire, puis se traverser.",
  },
  {
    title: "Autonomisation",
    description:
      "Nous ne distribuons pas de solutions toutes faites. Nous transmettons des outils, pour que chacun·e reparte capable de tenir debout sans nous.",
  },
];

export const impactStats = [
  { value: 3, suffix: "", label: "éditions du CIGIBM organisées" },
  { value: 58000, suffix: "+", label: "personnes touchées (présentiel + en ligne)" },
  { value: 6, suffix: "+", label: "années d'accompagnement de terrain" },
];

export const cigibm = {
  fullName:
    "Congrès International de Guérison Intérieure et de Bien-être Mental",
  acronym: "CIGIBM",
  edition: "3ème édition",
  theme: "Équilibre",
  dates: "29 et 30 novembre 2025",
  sponsor: "Steeve Facia",
  venues: [
    "Centre Culturel Le Centre — Godomey, Abomey-Calavi (29 nov., visite guidée)",
    "Palais des Congrès — Cotonou (30 nov.)",
  ],
  objective:
    "Aider les participants à se sentir compris et soutenus, en leur donnant les outils nécessaires pour sortir de leur prison émotionnelle et sentimentale.",
  programme: [
    {
      title: "Ateliers thématiques",
      description:
        "Des espaces pratiques pour explorer des outils concrets de régulation émotionnelle et de développement personnel.",
    },
    {
      title: "Conférences & témoignages",
      description:
        "Des experts et des personnes ayant traversé l'épreuve partagent savoirs et vécus pour éclairer et inspirer.",
    },
    {
      title: "Rencontres d'experts",
      description:
        "Des temps d'échange direct avec des professionnels de la santé mentale et de l'accompagnement psychosocial.",
    },
    {
      title: "Méditation & prière",
      description:
        "Des moments de recueillement et de reconnexion à soi, dans le respect des sensibilités de chacun.",
    },
  ],
  pastEditions: [
    {
      // Photos dédiées (une ou plusieurs) : public/images/cigibm-edition-1/
      id: "edition-1",
      edition: "1ère édition",
      year: "29 mars 2023",
      theme: "La dépression, parlons-en",
      location: "Very Nice Hôtel",
      attendance: "203 personnes en présentiel",
      description:
        "Première édition du congrès, consacrée à libérer la parole autour de la dépression.",
    },
    {
      // Photos dédiées (une ou plusieurs) : public/images/cigibm-edition-2/
      id: "edition-2",
      edition: "2ème édition",
      year: "27 avril 2024",
      theme: "Réinvente-toi",
      location: "Lucide Palace, Godomey",
      attendance: "1 000 personnes en présentiel · 21 800 en ligne",
      description:
        "Participants venus du Bénin et de la sous-région (entrepreneurs, femmes, enfants). Approches proposées sur la spiritualité, le bien-être mental des entrepreneurs, et la guérison des blessures intérieures et de la dépression.",
    },
    {
      // Photos dédiées (une ou plusieurs) : public/images/cigibm-edition-3/
      id: "edition-3",
      edition: "3ème édition",
      year: "29-30 novembre 2025",
      theme: "Équilibre",
      location: "Godomey puis Cotonou",
      attendance: "1 100 personnes en présentiel · 34 200 en ligne",
      description:
        "Parrainage de Steeve Facia. Ateliers, conférences, témoignages, moments de prière et de méditation sensibilisant sur le bien-être mental, la gestion du stress et le développement personnel.",
    },
  ],
  // Prochaine édition annoncée — dates à confirmer avec l'ONG (affiche reçue
  // avec une plage de dates incohérente : "17 au 13 octobre 2026").
  nextEdition: {
    // Photos de préparation / à venir : public/images/cigibm-edition-4/
    id: "edition-4",
    edition: "4ème édition",
    theme: "Le vaccin de la dépression",
    dates: "17 et 18 octobre 2026",
    venue: "Palais des Congrès de Cotonou",
    note: "Participation gratuite sur inscription.",
    registrationPhones: ["+229 01 68 28 06 75", "+229 01 57 30 43 29"],
    speakers: [
      {
        name: "Christelle Eugénie Gnimassou",
        role: "Promotrice",
      },
      {
        name: "Rudy Chapsal Aboua",
        role: "Intervenante — Entrepreneure & stratège de marque",
        bio: "Entrepreneure, stratège de marque et figure du leadership féminin en Afrique, Rudy Chapsal construit depuis plus de treize ans un écosystème d'entreprises entre le Bénin et le continent. Elle dirige L'Épicurienne et Bloom, et a fondé SOUV'REINES, une organisation dédiée à l'autonomisation et au leadership des femmes africaines. Elle est l'auteure de « SE TENIR — Lettres à la femme africaine qui n'abandonnera pas ».",
        featured: true,
      },
      { name: "Ahouignan Astéris A.", role: "Intervenant" },
      { name: "Narcisse Avocé", role: "Intervenant" },
      { name: "Espoir Tchehoun", role: "Intervenant" },
      { name: "Annick Mireille Azandjeme", role: "Intervenante" },
      { name: "Valdye Gbaguidi", role: "Intervenante" },
    ],
  },
};

export const methodeRacines = {
  acronym: "R.A.C.I.N.E.S.",
  fullTitle: "La Méthode R.A.C.I.N.E.S.",
  subtitle:
    "Un cadre méthodologique pour la guérison intérieure, le développement des compétences émotionnelles et le renforcement de la résilience.",
  intro:
    "La Méthode R.A.C.I.N.E.S. est un cadre méthodologique conçu pour accompagner les individus, les communautés et les organisations dans le développement des compétences émotionnelles, la compréhension des blessures psychologiques, le renforcement de la résilience et la reconstruction identitaire.",
  origin:
    "Elle est née de plus de six années d'expérience de terrain, au cours desquelles des centaines de personnes ont bénéficié d'un accompagnement individuel et des milliers d'autres ont été sensibilisées à travers des conférences, des congrès, des formations et des initiatives communautaires consacrés au bien-être mental.",
  observation:
    "Cette expérience a mis en évidence un constat récurrent : de nombreuses difficultés émotionnelles, relationnelles et comportementales trouvent leur origine dans des expériences de vie non intégrées, qui continuent d'influencer les choix, les relations, les performances et la qualité de vie. La Méthode R.A.C.I.N.E.S. propose un parcours structuré permettant d'identifier ces mécanismes, de développer une meilleure compréhension de soi, de renforcer les ressources personnelles et d'encourager des changements durables.",
  vision: {
    intro:
      "Je suis convaincue que la santé mentale ne se limite pas à l'absence de troubles psychologiques. Elle repose aussi sur la capacité de chaque personne à comprendre son histoire, à développer son intelligence émotionnelle, à renforcer sa résilience et à construire des relations saines avec elle-même et avec les autres.",
  paragraphs: [
      "À travers la Méthode R.A.C.I.N.E.S., ma vision est de contribuer à faire de la guérison intérieure un pilier du développement humain, de la prévention des souffrances psychologiques et du renforcement du bien-être des individus, des familles, des organisations et des communautés.",
      "Mon ambition est de mettre à la disposition des professionnels, des établissements d'enseignement, des institutions publiques, des entreprises et des organisations nationales et internationales un cadre méthodologique structuré, adaptable à différents contextes culturels, qui favorise le développement des compétences émotionnelles, la résilience et la reconstruction identitaire.",
      "Je crois qu'une société plus équilibrée se construit en investissant dans l'être humain. Lorsque les personnes développent une meilleure compréhension d'elles-mêmes, elles prennent des décisions plus éclairées, construisent des relations plus saines et participent plus activement au développement de leur communauté.",
    ],
    closing:
      "La Méthode R.A.C.I.N.E.S. s'inscrit dans cette conviction : accompagner la transformation individuelle pour contribuer, à plus grande échelle, à une transformation collective.",
  },
  principles: [
    "Reconnaître la dignité, l'histoire et les ressources propres à chaque personne.",
    "Favoriser une compréhension globale des dimensions émotionnelles, relationnelles et comportementales.",
    "Développer les compétences favorisant la résilience et l'autonomie.",
    "Promouvoir des pratiques éthiques, respectueuses des contextes culturels et des réalités locales.",
    "Inscrire le changement dans une dynamique durable grâce à des apprentissages progressifs et à leur mise en pratique.",
  ],
  steps: [
    {
      letter: "R",
      title: "Reconnaître",
      description:
        "Identifier les expériences, émotions et schémas qui influencent le fonctionnement actuel.",
    },
    {
      letter: "A",
      title: "Accepter",
      description:
        "Accueillir son histoire avec lucidité afin de créer les conditions d'un changement conscient.",
    },
    {
      letter: "C",
      title: "Comprendre",
      description:
        "Analyser les mécanismes, les croyances et les facteurs ayant contribué à la construction des schémas actuels.",
    },
    {
      letter: "I",
      title: "Intégrer",
      description:
        "Transformer les expériences vécues en apprentissages et renforcer la cohérence entre l'histoire personnelle et l'identité présente.",
    },
    {
      letter: "N",
      title: "Neutraliser",
      description:
        "Réduire l'influence des croyances limitantes et des automatismes émotionnels afin de favoriser des réponses plus adaptées.",
    },
    {
      letter: "E",
      title: "Engager",
      description:
        "Mettre en œuvre de nouveaux comportements, renforcer les compétences psychosociales et agir de manière cohérente avec ses valeurs.",
    },
    {
      letter: "S",
      title: "Solidifier",
      description:
        "Consolider les acquis grâce à des pratiques régulières, au soutien de l'environnement et à une démarche continue de développement personnel.",
    },
  ],
  domains: [
    "Établissements scolaires et universitaires",
    "Programmes communautaires",
    "Structures de santé et de promotion du bien-être",
    "Organisations publiques et privées",
    "Associations et ONG",
    "Entreprises engagées dans la qualité de vie au travail",
    "Dispositifs de formation et de développement du leadership",
  ],
  evolution:
    "La Méthode R.A.C.I.N.E.S. s'inscrit dans une démarche d'amélioration continue. Elle est enrichie par l'expérience de terrain, les enseignements issus des accompagnements réalisés et les retours des personnes et des communautés accompagnées. Dans une perspective de développement et de transmission, elle a vocation à évoluer à travers des collaborations interdisciplinaires, des partenariats avec des acteurs de l'éducation, de la santé mentale, de la recherche et du développement humain, ainsi que par des démarches d'évaluation adaptées à ses différents contextes d'application.",
};

export const values = [
  {
    title: "Écoute",
    description:
      "Ici, personne n'est jugé. Chacun est entendu, tel qu'il est, là où il en est.",
  },
  {
    title: "Dignité",
    description:
      "Chaque histoire compte. Chaque personne accompagnée est reconnue dans sa force, pas seulement dans sa blessure.",
  },
  {
    title: "Transformation",
    description:
      "Nous croyons, sans réserve, que la guérison intérieure est possible — à tout âge, après toute épreuve.",
  },
  {
    title: "Communauté",
    description:
      "Faire de la santé mentale un sujet qu'on partage à voix haute, plutôt qu'un secret qu'on porte seul.",
  },
];

export const supportWays = [
  {
    title: "Faire un don",
    description:
      "Un don ne disparaît pas dans une structure : il devient un atelier animé, une écoute offerte, une place gratuite au congrès pour quelqu'un qui n'aurait pas pu venir.",
    details: [
      "Virement bancaire — RIB communiqué sur demande", // [PLACEHOLDER]
      "Mobile Money — MTN / Moov, numéro communiqué sur demande", // [PLACEHOLDER]
    ],
  },
  {
    title: "Devenir bénévole",
    description:
      "Accueillir, orienter, écouter, porter des chaises : le congrès tient debout grâce à des gens ordinaires qui donnent un week-end. Vous n'avez besoin d'aucune qualification particulière.",
    details: ["Écrivez-nous via le formulaire de contact"],
  },
  {
    title: "Devenir partenaire",
    description:
      "La santé mentale reste un angle mort du débat public béninois. Y associer votre organisation, c'est aider à le combler — et rendre visible un engagement qui compte réellement.",
    details: ["Contactez-nous pour discuter d'un partenariat sur mesure"],
  },
];
