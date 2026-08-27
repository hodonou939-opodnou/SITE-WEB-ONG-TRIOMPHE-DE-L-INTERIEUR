// Canal WhatsApp : pas encore de compte WhatsApp Business Platform actif.
// Cette fonction garde la même interface que sendSms/sendTransactionalEmail
// pour que le sélecteur de canal dans l'admin puisse s'y brancher sans
// changement quand l'API sera configurée.
export async function sendWhatsApp(
  _to: string,
  _text: string
): Promise<{ ok: false; error: string }> {
  return {
    ok: false,
    error: "Le canal WhatsApp n'est pas encore configuré (compte WhatsApp Business Platform requis).",
  };
}
