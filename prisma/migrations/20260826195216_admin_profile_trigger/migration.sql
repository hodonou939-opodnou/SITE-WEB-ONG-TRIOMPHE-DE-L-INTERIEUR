-- Chaque nouvel utilisateur Supabase Auth reçoit automatiquement une ligne
-- AdminProfile (rôle "scanner" par défaut) : le trigger tourne côté
-- Postgres, donc il s'applique peu importe comment le compte a été créé
-- (invitation dashboard, lien magique, etc.).
create or replace function public.handle_new_admin_user()
returns trigger as $$
begin
  insert into public."AdminProfile" (id, "fullName", role, "testBypass", "createdAt")
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'scanner',
    false,
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_admin_user();
