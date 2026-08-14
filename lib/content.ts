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
    "Vous n'êtes pas seul·e face à vos blessures invisibles. Sous la présidence de Christelle Eugénie Gnimassou, nous ouvrons des espaces où la parole libère, où l'épreuve trouve du sens, et où l'équilibre redevient possible.",
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

export const missionPillars = [
  {
    title: "Actions humanitaires",
    description:
      "Derrière chaque geste, un visage : celui d'un orphelin, d'une veuve, d'un enfant en difficulté. Nous agissons là où l'urgence est la plus vive.",
  },
  {
    title: "Guérison intérieure & bien-être mental",
    description:
      "Personne ne devrait porter seul·e le poids d'une blessure émotionnelle. Nous accompagnons les femmes et les jeunes vers un équilibre retrouvé.",
  },
  {
    title: "Autonomisation",
    description:
      "Nous ne donnons pas de solutions toutes faites : nous donnons les moyens de devenir l'actrice, l'acteur de sa propre transformation.",
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
      edition: "1ère édition",
      year: "29 mars 2023",
      theme: "La dépression, parlons-en",
      location: "Very Nice Hôtel",
      attendance: "203 personnes en présentiel",
      description:
        "Première édition du congrès, consacrée à libérer la parole autour de la dépression.",
    },
    {
      edition: "2ème édition",
      year: "27 avril 2024",
      theme: "Réinvente-toi",
      location: "Lucide Palace, Godomey",
      attendance: "1 000 personnes en présentiel · 21 800 en ligne",
      description:
        "Participants venus du Bénin et de la sous-région (entrepreneurs, femmes, enfants). Approches proposées sur la spiritualité, le bien-être mental des entrepreneurs, et la guérison des blessures intérieures et de la dépression.",
    },
    {
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
      "Chaque don devient un atelier animé, une écoute offerte, un congrès organisé. Votre générosité finance directement notre mission de terrain.",
    details: [
      "Virement bancaire — RIB communiqué sur demande", // [PLACEHOLDER]
      "Mobile Money — MTN / Moov, numéro communiqué sur demande", // [PLACEHOLDER]
    ],
  },
  {
    title: "Devenir bénévole",
    description:
      "Votre temps a plus de valeur que vous ne l'imaginez. Rejoignez une équipe engagée, sur le terrain, à chaque édition du CIGIBM.",
    details: ["Écrivez-nous via le formulaire de contact"],
  },
  {
    title: "Devenir partenaire",
    description:
      "Associez votre marque à une cause qui change des vies, et donnez à la santé mentale la visibilité qu'elle mérite.",
    details: ["Contactez-nous pour discuter d'un partenariat sur mesure"],
  },
];
