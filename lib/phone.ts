// Numéros locaux béninois saisis sans indicatif (ex. "0196966501") : on
// préfixe +229 par défaut, seul public visé par le CRM. Les numéros déjà
// internationaux (+ ou 00) sont laissés tels quels.
export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s.\-()]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  return `+229${cleaned}`;
}
