-- Référentiel officiel du modèle de compte de gestion annexé à l'arrêté du 4 juillet 2024.
-- Les données présentes avant cette migration sont des données de développement/test.
-- Après migration, seules les 56 lignes officielles restent des catégories système.

alter table public.categories
  add column official_code text,
  add column official_section text,
  add column official_group text,
  add column official_order integer,
  add column official_category_id uuid references public.categories(id) on delete restrict;

drop index public.categories_system_name_unique_idx;

create unique index categories_official_code_unique_idx
  on public.categories (official_code)
  where official_code is not null;

create index categories_official_order_idx
  on public.categories (usage, official_order)
  where official_code is not null;

create index categories_official_category_id_idx
  on public.categories (official_category_id)
  where official_category_id is not null;

alter table public.categories
  add constraint categories_official_metadata_consistency check (
    (official_code is null and official_section is null and official_group is null and official_order is null)
    or
    (is_system and owner_id is null and official_code is not null
      and official_section is not null and official_group is not null and official_order is not null
      and official_category_id is null and usage in ('income', 'expense'))
  ),
  add constraint categories_personal_official_shape check (
    is_system or (official_code is null and official_section is null and official_group is null and official_order is null)
  );

insert into public.categories
  (name, usage, is_system, active, official_code, official_section, official_group, official_order)
values
  ('Salaire', 'income', true, true, 'RES-1-01', 'Ressources', 'Les revenus', 101),
  ('Pension de retraite', 'income', true, true, 'RES-1-02', 'Ressources', 'Les revenus', 102),
  ('Pension alimentaire', 'income', true, true, 'RES-1-03', 'Ressources', 'Les revenus', 103),
  ('Rente viagère', 'income', true, true, 'RES-1-04', 'Ressources', 'Les revenus', 104),
  ('Revenus locatifs', 'income', true, true, 'RES-1-05', 'Ressources', 'Les revenus', 105),
  ('Autre (précisez)', 'income', true, true, 'RES-1-06', 'Ressources', 'Les revenus', 106),
  ('Allocation adulte handicapé', 'income', true, true, 'RES-2-01', 'Ressources', 'Les allocations', 201),
  ('Allocations familiales', 'income', true, true, 'RES-2-02', 'Ressources', 'Les allocations', 202),
  ('Allocation logement', 'income', true, true, 'RES-2-03', 'Ressources', 'Les allocations', 203),
  ('Allocation chômage', 'income', true, true, 'RES-2-04', 'Ressources', 'Les allocations', 204),
  ('Autre (précisez)', 'income', true, true, 'RES-2-05', 'Ressources', 'Les allocations', 205),
  ('Revenus des placements (montant des intérêts ou dividendes versés sur les comptes bancaires)', 'income', true, true, 'RES-3-01', 'Ressources', 'Les revenus mobiliers', 301),
  ('Revenus exceptionnels (donation, héritage, etc.)', 'income', true, true, 'RES-3-02', 'Ressources', 'Les revenus mobiliers', 302),
  ('Autre (précisez)', 'income', true, true, 'RES-3-03', 'Ressources', 'Les revenus mobiliers', 303),
  ('Vente d''un bien immobilier (ex : appartement, maison, etc.)', 'income', true, true, 'RES-4-01', 'Ressources', 'Les autres ressources', 401),
  ('Vente d''un bien mobilier (ex : voiture, meuble de valeur, etc.)', 'income', true, true, 'RES-4-02', 'Ressources', 'Les autres ressources', 402),
  ('Remboursements (CPAM, mutuelle, etc.)', 'income', true, true, 'RES-4-03', 'Ressources', 'Les autres ressources', 403),
  ('Autre (précisez)', 'income', true, true, 'RES-4-04', 'Ressources', 'Les autres ressources', 404),

  ('Habillement', 'expense', true, true, 'DEP-1-01', 'Dépenses', 'Les dépenses de la vie courante', 101),
  ('Alimentation', 'expense', true, true, 'DEP-1-02', 'Dépenses', 'Les dépenses de la vie courante', 102),
  ('Loisirs-vacances', 'expense', true, true, 'DEP-1-03', 'Dépenses', 'Les dépenses de la vie courante', 103),
  ('Frais médicaux', 'expense', true, true, 'DEP-1-04', 'Dépenses', 'Les dépenses de la vie courante', 104),
  ('Frais de scolarité', 'expense', true, true, 'DEP-1-05', 'Dépenses', 'Les dépenses de la vie courante', 105),
  ('Argent de vie', 'expense', true, true, 'DEP-1-06', 'Dépenses', 'Les dépenses de la vie courante', 106),
  ('Transports', 'expense', true, true, 'DEP-1-07', 'Dépenses', 'Les dépenses de la vie courante', 107),
  ('Autre (précisez)', 'expense', true, true, 'DEP-1-08', 'Dépenses', 'Les dépenses de la vie courante', 108),
  ('Loyer', 'expense', true, true, 'DEP-2-01', 'Dépenses', 'Le logement', 201),
  ('Frais d''hébergement', 'expense', true, true, 'DEP-2-02', 'Dépenses', 'Le logement', 202),
  ('Electricité', 'expense', true, true, 'DEP-2-03', 'Dépenses', 'Le logement', 203),
  ('Gaz', 'expense', true, true, 'DEP-2-04', 'Dépenses', 'Le logement', 204),
  ('Eau', 'expense', true, true, 'DEP-2-05', 'Dépenses', 'Le logement', 205),
  ('Téléphone - internet', 'expense', true, true, 'DEP-2-06', 'Dépenses', 'Le logement', 206),
  ('Autre (précisez)', 'expense', true, true, 'DEP-2-07', 'Dépenses', 'Le logement', 207),
  ('Impôts sur le revenu', 'expense', true, true, 'DEP-3-01', 'Dépenses', 'Les impôts et taxes', 301),
  ('Impôt sur la fortune immobilière', 'expense', true, true, 'DEP-3-02', 'Dépenses', 'Les impôts et taxes', 302),
  ('Taxe foncière', 'expense', true, true, 'DEP-3-03', 'Dépenses', 'Les impôts et taxes', 303),
  ('Autre (précisez)', 'expense', true, true, 'DEP-3-04', 'Dépenses', 'Les impôts et taxes', 304),
  ('Habitation', 'expense', true, true, 'DEP-4-01', 'Dépenses', 'Les frais d''assurance', 401),
  ('Automobile', 'expense', true, true, 'DEP-4-02', 'Dépenses', 'Les frais d''assurance', 402),
  ('Santé (ex : mutuelle)', 'expense', true, true, 'DEP-4-03', 'Dépenses', 'Les frais d''assurance', 403),
  ('Autre (précisez)', 'expense', true, true, 'DEP-4-04', 'Dépenses', 'Les frais d''assurance', 404),
  ('Aide à domicile', 'expense', true, true, 'DEP-5-01', 'Dépenses', 'Les frais de maintien à domicile', 501),
  ('Autre (précisez)', 'expense', true, true, 'DEP-5-02', 'Dépenses', 'Les frais de maintien à domicile', 502),
  ('Immeuble (ex : appartement, maison)', 'expense', true, true, 'DEP-6-01', 'Dépenses', 'Les achats importants', 601),
  ('Automobile', 'expense', true, true, 'DEP-6-02', 'Dépenses', 'Les achats importants', 602),
  ('Meuble (ex : armoire, lit, télévision, etc.)', 'expense', true, true, 'DEP-6-03', 'Dépenses', 'Les achats importants', 603),
  ('Autre (précisez)', 'expense', true, true, 'DEP-6-04', 'Dépenses', 'Les achats importants', 604),
  ('Travaux d''aménagement immobilier (ex : rénovation de façade d''immeuble - peinture)', 'expense', true, true, 'DEP-7-01', 'Dépenses', 'Les travaux divers et réparations', 701),
  ('Réparations d''entretien (ex : fuite d''eau)', 'expense', true, true, 'DEP-7-02', 'Dépenses', 'Les travaux divers et réparations', 702),
  ('Autre (précisez)', 'expense', true, true, 'DEP-7-03', 'Dépenses', 'Les travaux divers et réparations', 703),
  ('Placements mobiliers (actions, SICAV, livret, autre)', 'expense', true, true, 'DEP-8-01', 'Dépenses', 'Les placements', 801),
  ('Montant total des dettes remboursées sur l''année', 'expense', true, true, 'DEP-9-01', 'Dépenses', 'Les emprunts en cours', 901),
  ('Autre (précisez)', 'expense', true, true, 'DEP-9-02', 'Dépenses', 'Les emprunts en cours', 902),
  ('Rémunération de la personne en charge de la mesure de protection (s''il s''agit d''un mandataire judiciaire à la protection des majeurs)', 'expense', true, true, 'DEP-10-01', 'Dépenses', 'Autres dépenses', 1001),
  ('Coût du contrôle des comptes de gestion (s''il est assuré par un professionnel qualifié)', 'expense', true, true, 'DEP-10-02', 'Dépenses', 'Autres dépenses', 1002),
  ('Autre (précisez)', 'expense', true, true, 'DEP-10-03', 'Dépenses', 'Autres dépenses', 1003);

-- Correspondances globales certaines ou explicitement justifiées pour les données de test.
-- Énergie est rattachée à l'Autre du groupe Logement : l'ancienne catégorie agrègeait
-- plusieurs lignes officielles distinctes (électricité, gaz et eau).
alter table public.transactions disable trigger transactions_protect_closed_period;

with certain_mapping(old_name, official_code) as (
  values
    ('Retraite', 'RES-1-02'),
    ('Revenus locatifs', 'RES-1-05'),
    ('Intérêts', 'RES-3-01'),
    ('Remboursements', 'RES-4-03'),
    ('Hébergement / EHPAD', 'DEP-2-02'),
    ('Alimentation', 'DEP-1-02'),
    ('Santé', 'DEP-1-04'),
    ('Énergie', 'DEP-2-07'),
    ('Téléphone / Internet', 'DEP-2-06'),
    ('Transport', 'DEP-1-07'),
    ('Loisirs', 'DEP-1-03')
), resolved as (
  select old_category.id as old_id, official_category.id as official_id
  from certain_mapping
  join public.categories old_category
    on old_category.is_system and old_category.official_code is null
   and old_category.name = certain_mapping.old_name
  join public.categories official_category
    on official_category.official_code = certain_mapping.official_code
)
update public.transactions transaction
set category_id = resolved.official_id
from resolved
where transaction.category_id = resolved.old_id;

-- Reclassement ciblé d'une donnée de test. L'ancienne catégorie Autres dépenses
-- ne possède aucun équivalent global ; le libellé ZEEMAN correspond ici à Habillement.
update public.transactions transaction
set category_id = official_category.id
from public.categories old_category, public.categories official_category
where transaction.category_id = old_category.id
  and old_category.is_system
  and old_category.official_code is null
  and old_category.name = 'Autres dépenses'
  and upper(trim(transaction.label)) = 'ZEEMAN'
  and official_category.official_code = 'DEP-1-01';

alter table public.transactions enable trigger transactions_protect_closed_period;

-- Sécurité : ne jamais supprimer une ancienne catégorie encore référencée.
do $$
declare
  unresolved text;
begin
  select string_agg(format('%s (%s opération(s))', category.name, category_references.reference_count), ', ' order by category.name)
  into unresolved
  from public.categories category
  join (
    select category_id, count(*) as reference_count from public.transactions group by category_id
  ) category_references on category_references.category_id = category.id
  where category.is_system and category.official_code is null;

  if unresolved is not null then
    raise exception 'Anciennes catégories système encore référencées : %', unresolved;
  end if;
end;
$$;

delete from public.categories
where is_system and official_code is null;

do $$
begin
  if (select count(*) from public.categories where is_system) <> 56
     or exists (select 1 from public.categories where is_system and official_code is null) then
    raise exception 'Le référentiel système final doit contenir exactement les 56 catégories officielles.';
  end if;
end;
$$;

create or replace function public.validate_category_reference()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  official_row public.categories%rowtype;
begin
  if old.is_system then
    raise exception 'Une catégorie système est immuable.';
  end if;

  if new.owner_id is distinct from old.owner_id or new.is_system is distinct from old.is_system then
    raise exception 'L’identité d’une catégorie personnelle est immuable.';
  end if;

  if new.official_category_id is null then
    -- Tolérance de transition : une ancienne catégorie personnelle sans rattachement
    -- peut uniquement être archivée. Toute autre modification impose son classement.
    if old.official_category_id is null and old.active and not new.active
       and new.name is not distinct from old.name and new.usage is not distinct from old.usage then
      return new;
    end if;
    raise exception 'Une catégorie personnelle doit référencer une catégorie officielle.';
  end if;

  select * into official_row
  from public.categories
  where id = new.official_category_id and is_system and official_code is not null and active;

  if not found then
    raise exception 'La catégorie officielle de rattachement est invalide.';
  end if;

  if new.usage <> official_row.usage then
    raise exception 'L’utilisation doit correspondre à la catégorie officielle.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_new_category_reference()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  official_row public.categories%rowtype;
begin
  if new.is_system then
    raise exception 'Les catégories officielles ne peuvent pas être créées directement.';
  end if;

  select * into official_row
  from public.categories
  where id = new.official_category_id and is_system and official_code is not null and active;

  if not found then
    raise exception 'Une catégorie personnelle doit référencer une catégorie officielle.';
  end if;

  if new.usage <> official_row.usage then
    raise exception 'L’utilisation doit correspondre à la catégorie officielle.';
  end if;

  return new;
end;
$$;

create trigger categories_validate_insert
before insert on public.categories
for each row execute function public.validate_new_category_reference();

create trigger categories_validate_update
before update on public.categories
for each row execute function public.validate_category_reference();

drop policy "categories_select_available" on public.categories;
create policy "categories_select_available" on public.categories
for select to authenticated
using (is_system or owner_id = (select auth.uid()));

drop policy "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories
for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and not is_system
  and not (select public.is_platform_admin())
);

drop policy "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories
for update to authenticated
using (
  owner_id = (select auth.uid())
  and not is_system
  and not (select public.is_platform_admin())
)
with check (
  owner_id = (select auth.uid())
  and not is_system
  and not (select public.is_platform_admin())
);

comment on column public.categories.official_code is
  'Code stable de la ligne du modèle officiel, par exemple RES-1-02 ou DEP-4-03.';
comment on column public.categories.official_category_id is
  'Catégorie officielle de rattachement d’une catégorie personnelle.';
