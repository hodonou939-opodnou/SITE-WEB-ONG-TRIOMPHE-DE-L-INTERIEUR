-- Le coalesce d'origine (full_name -> email) n'avait pas de filet de
-- sécurité final : un compte Supabase Auth créé uniquement par téléphone
-- (sans métadonnées ni email) fait échouer l'INSERT avec une violation
-- NOT NULL sur "AdminProfile"."fullName". Comme le trigger tourne en
-- "after insert" sur auth.users, l'exception annule toute la transaction
-- et empêche la création du compte. On ajoute un dernier filet qui ne peut
-- jamais être nul.
create or replace function public.handle_new_admin_user()
returns trigger as $$
begin
  insert into public."AdminProfile" (id, "fullName", role, "testBypass", "createdAt")
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.email,
      new.phone,
      'Utilisateur ' || left(new.id::text, 8)
    ),
    'scanner',
    false,
    now()
  );
  return new;
end;
$$ language plpgsql security definer;
