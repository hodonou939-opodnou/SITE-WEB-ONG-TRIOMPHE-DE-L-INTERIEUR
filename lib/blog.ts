// Contenu du Blog & Activités. Chaque post a un type ("article" ou
// "activite") pour permettre de filtrer les deux dans une seule grille.
// Le corps (`body`) est une liste de blocs typés plutôt qu'un texte brut,
// pour pouvoir alterner paragraphes, listes, citations et sections
// image-à-côté-du-texte quand un article est long.

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string }
  | {
      type: "imageText";
      image: { src: string; alt: string };
      imagePosition: "left" | "right";
      heading?: string;
      paragraphs: string[];
    };

export type BlogPost = {
  slug: string;
  type: "article" | "activite";
  title: string;
  excerpt: string;
  date: string; // format affiché
  isoDate: string; // format ISO pour les métadonnées / JSON-LD
  readTime: string;
  author: string;
  featuredImage: { src: string; alt: string; credit?: string };
  body: BlogBlock[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "pourquoi-le-mental-dabord-femme-celibataire",
    type: "article",
    title: "Pourquoi le mental d'abord si tu es une femme célibataire ?",
    excerpt:
      "Avant de chercher la bonne personne, il y a une question plus urgente à te poser : qui es-tu, quand personne ne te regarde ?",
    date: "16 août 2026",
    isoDate: "2026-08-16",
    readTime: "6 min",
    author: "ONG Triomphe de l'Intérieur",
    featuredImage: {
      src: "/images/blog-mental-femme-celibataire.jpg",
      alt: "Portrait d'une femme pensive, le visage posé sur ses mains",
      credit: "Photo : Anna Shvets / Pexels",
    },
    body: [
      {
        type: "paragraph",
        text: "« Et toi, c'est pour quand ? » Si tu es une femme célibataire, tu connais la question. Elle arrive à chaque mariage, chaque fête de fin d'année, chaque coup de fil avec une tata. Elle sous-entend que ta vie est en pause, en attente de quelqu'un d'autre pour commencer vraiment.",
      },
      {
        type: "paragraph",
        text: "Et sous la pression, beaucoup de femmes se mettent à chercher la solution au mauvais endroit : la bonne personne, la bonne rencontre, le bon timing. Alors qu'il y a une question plus urgente, qu'on nous apprend rarement à nous poser : qui es-tu, quand personne ne te regarde ?",
      },
      {
        type: "heading",
        text: "La pression ne vient jamais seule",
      },
      {
        type: "paragraph",
        text: "Derrière « et toi, c'est pour quand ? », il y a souvent une accumulation : la comparaison avec les amies qui « ont réussi » à se marier, la peur de décevoir une famille, l'angoisse de l'horloge biologique qu'on agite comme une menace. Cette pression ne cherche pas à te faire du bien. Elle cherche à te faire bouger, vite, avant que tu aies eu le temps de savoir ce que tu veux vraiment.",
      },
      {
        type: "paragraph",
        text: "Le problème, ce n'est pas d'avoir envie d'aimer et d'être aimée. C'est de laisser la pression choisir à ta place, au point d'accepter la première personne disponible, ou de rester dans une relation qui abîme, seulement pour ne plus avoir à répondre à la question.",
      },
      {
        type: "imageText",
        image: {
          src: "/images/blog-mental-femme-celibataire-journaling.jpg",
          alt: "Femme assise sur son lit, en train d'écrire dans un carnet, lumière du matin",
        },
        imagePosition: "left",
        heading: "Se marier pour de mauvaises raisons coûte plus cher que d'attendre",
        paragraphs: [
          "Une union construite sur la peur de rester seule ne guérit jamais cette peur, elle la déplace. On se retrouve à reproduire les mêmes schémas, à choisir les mêmes profils, à répéter les mêmes blessures, simplement avec un visage différent en face.",
          "C'est pour ça que le travail intérieur vient avant, pas après. Comprendre pourquoi on attire certaines dynamiques, d'où vient cette peur de ne pas être « assez », ce que l'on porte encore d'un père absent, d'une mère blessée, d'une première rupture jamais digérée : c'est ce travail qui change qui l'on choisit ensuite, et comment on se laisse aimer.",
          "Une femme qui se connaît, qui a fait la paix avec son histoire, ne cherche plus quelqu'un pour se sentir complète. Elle cherche quelqu'un avec qui construire, ce qui n'est pas du tout la même recherche, ni la même vie ensuite.",
        ],
      },
      {
        type: "heading",
        text: "Ce que « le mental d'abord » veut dire concrètement",
      },
      {
        type: "paragraph",
        text: "Ce n'est pas une formule abstraite. Concrètement, ça veut dire :",
      },
      {
        type: "list",
        items: [
          "Identifier les schémas qui reviennent dans tes relations, plutôt que de blâmer « la malchance » ou « les hommes d'aujourd'hui ».",
          "Apprendre à poser des limites sans culpabiliser, y compris avec la famille qui presse.",
          "Reconstruire ton estime de toi en dehors du regard d'un partenaire, pour ne plus en dépendre entièrement.",
          "T'entourer de personnes et d'espaces où tu peux parler sans être jugée, ni renvoyée à ton statut marital.",
          "Accepter qu'attendre, quand c'est un choix conscient et non une fuite, n'est jamais du temps perdu.",
        ],
      },
      {
        type: "quote",
        text: "Tu n'as pas besoin d'être choisie pour être entière. Tu l'es déjà, tu as juste besoin qu'on te le rappelle assez souvent pour finir par y croire.",
      },
      {
        type: "heading",
        text: "Tu n'as pas à faire ce travail seule",
      },
      {
        type: "paragraph",
        text: "C'est exactement ce que nous accompagnons à Triomphe de l'Intérieur : comprendre son histoire, désamorcer les schémas qui se répètent, et se reconstruire une base solide, avant de chercher à construire à deux. La Méthode R.A.C.I.N.E.S. donne un cadre pour ce travail, et le CIGIBM, notre congrès annuel, en fait un moment collectif : des centaines de femmes qui se posent les mêmes questions, dans la même salle, sans honte.",
      },
      {
        type: "paragraph",
        text: "Si cet article résonne, la meilleure prochaine étape n'est pas d'attendre le prochain commentaire de famille pour réagir. C'est de réserver un moment pour toi, dès maintenant.",
      },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getSortedPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => (a.isoDate < b.isoDate ? 1 : -1));
}
