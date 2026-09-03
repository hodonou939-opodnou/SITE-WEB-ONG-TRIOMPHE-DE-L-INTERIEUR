import { createClient } from "@supabase/supabase-js";

// Client élevé (clé secrète, jamais exposée au navigateur) réservé au code
// serveur qui doit contourner les RLS — ex. l'upload de photo d'ambassadeur
// depuis un formulaire public non authentifié (app/api/ambassador-signup).
// Ne jamais importer ce module depuis un composant client.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY");
  }

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
