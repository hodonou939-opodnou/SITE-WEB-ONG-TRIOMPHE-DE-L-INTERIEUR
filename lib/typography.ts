// Typographie française : la ponctuation haute (: ; ! ?) et les guillemets ne
// doivent jamais se retrouver seuls en début de ligne. On remplace l'espace qui
// les sépare du mot par une espace insécable.
export function frenchSpacing(text: string): string {
  return text
    .replace(/« /g, "« ")
    .replace(/ »/g, " »")
    .replace(/ ([:;!?])/g, " $1")
    // Séparateur des milliers : « 58 000 » ne se coupe jamais entre « 58 » et « 000 ».
    .replace(/(\d) (?=\d{3}\b)/g, "$1 ");
}
