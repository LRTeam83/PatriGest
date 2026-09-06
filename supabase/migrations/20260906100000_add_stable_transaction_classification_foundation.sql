alter table public.categories
  add column requires_precision boolean not null default false;

alter table public.categories
  add constraint categories_requires_precision_official_terminal check (
    not requires_precision
    or (
      is_system
      and owner_id is null
      and official_code is not null
      and official_category_id is null
    )
  );

do $$
declare
  expected_codes constant text[] := array[
    'DEP-1-08',
    'DEP-2-07',
    'DEP-3-04',
    'DEP-4-04',
    'DEP-5-02',
    'DEP-6-04',
    'DEP-7-03',
    'DEP-9-02',
    'DEP-10-03',
    'RES-1-06',
    'RES-2-05',
    'RES-3-03',
    'RES-4-04'
  ];
  matching_count integer;
begin
  select count(*)
  into matching_count
  from public.categories
  where official_code = any(expected_codes)
    and is_system
    and owner_id is null
    and official_category_id is null;

  if cardinality(expected_codes) <> 13 or matching_count <> 13 then
    raise exception
      'Le référentiel doit contenir exactement les 13 catégories officielles terminales exigeant une précision (trouvées : %).',
      matching_count;
  end if;

  if exists (
    select 1
    from unnest(expected_codes) as expected(official_code)
    left join public.categories category
      on category.official_code = expected.official_code
    where category.id is null
  ) then
    raise exception 'Au moins un code officiel exigeant une précision est absent.';
  end if;
end;
$$;

-- Les catégories système sont immuables pour le code applicatif. La protection
-- est suspendue uniquement dans cette transaction pour initialiser le référentiel.
alter table public.categories disable trigger categories_validate_update;
alter table public.categories disable trigger categories_set_updated_at;

update public.categories
set requires_precision = true
where official_code = any(array[
  'DEP-1-08',
  'DEP-2-07',
  'DEP-3-04',
  'DEP-4-04',
  'DEP-5-02',
  'DEP-6-04',
  'DEP-7-03',
  'DEP-9-02',
  'DEP-10-03',
  'RES-1-06',
  'RES-2-05',
  'RES-3-03',
  'RES-4-04'
]);

alter table public.categories enable trigger categories_validate_update;
alter table public.categories enable trigger categories_set_updated_at;

do $$
begin
  if (select count(*) from public.categories where requires_precision) <> 13 then
    raise exception 'Exactement 13 catégories doivent exiger une précision.';
  end if;

  if exists (
    select 1
    from public.categories
    where requires_precision
      and (
        not is_system
        or owner_id is not null
        or official_code is null
        or official_category_id is not null
      )
  ) then
    raise exception 'Une catégorie exigeant une précision doit être officielle et terminale.';
  end if;
end;
$$;

alter table public.transactions
  add column accounting_nature text,
  add column official_category_id uuid references public.categories(id) on delete restrict,
  add column classification_precision text,
  add constraint transactions_accounting_nature_check check (
    accounting_nature is null
    or accounting_nature in ('ordinary', 'capital_movement')
  ),
  add constraint transactions_classification_precision_check check (
    classification_precision is null
    or (
      classification_precision = btrim(classification_precision)
      and char_length(classification_precision) between 1 and 160
    )
  ),
  add constraint transactions_classification_shape_check check (
    (
      transaction_type in ('transfer_in', 'transfer_out')
      and accounting_nature is null
      and official_category_id is null
      and classification_precision is null
    )
    or (
      transaction_type in ('income', 'expense')
      and (
        accounting_nature is null
        or accounting_nature = 'ordinary'
        or (
          accounting_nature = 'capital_movement'
          and official_category_id is null
          and classification_precision is null
        )
      )
      and (classification_precision is null or official_category_id is not null)
    )
  );

create index transactions_official_category_id_idx
  on public.transactions (official_category_id);

create or replace function public.normalize_transaction_classification()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  resolved_official_category_id uuid;
begin
  new.classification_precision := nullif(btrim(new.classification_precision), '');

  if new.transaction_type in ('transfer_in', 'transfer_out') then
    return new;
  end if;

  if new.accounting_nature is null then
    new.accounting_nature := 'ordinary';
  end if;

  if new.accounting_nature <> 'ordinary' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.official_category_id is not null or new.category_id is null then
      return new;
    end if;
  elsif new.category_id is distinct from old.category_id then
    -- Un changement de l'ancien champ reste prioritaire uniquement lorsque le
    -- futur champ n'a pas été modifié indépendamment dans la même requête.
    if new.official_category_id is distinct from old.official_category_id then
      return new;
    end if;

    new.classification_precision := null;

    if new.category_id is null then
      new.official_category_id := null;
      return new;
    end if;
  elsif new.official_category_id is not null or new.category_id is null then
    return new;
  end if;

  select case
    when category.is_system
      and category.official_code is not null
      and category.official_category_id is null
      then category.id
    when not category.is_system then category.official_category_id
    else null
  end
  into resolved_official_category_id
  from public.categories category
  where category.id = new.category_id;

  new.official_category_id := resolved_official_category_id;
  return new;
end;
$$;

create or replace function public.validate_transaction_classification()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  official_category public.categories%rowtype;
  is_new_assignment boolean;
begin
  if new.transaction_type in ('transfer_in', 'transfer_out') then
    if new.accounting_nature is not null
       or new.official_category_id is not null
       or new.classification_precision is not null then
      raise exception 'Un transfert structuré ne peut pas porter de classification.';
    end if;
    return new;
  end if;

  if new.accounting_nature = 'capital_movement' then
    if new.transfer_id is not null
       or new.official_category_id is not null
       or new.classification_precision is not null then
      raise exception 'Un mouvement de capital ne peut pas porter de catégorie, de précision ou de transfert.';
    end if;
    return new;
  end if;

  if new.classification_precision is not null
     and char_length(new.classification_precision) > 160 then
    raise exception 'La précision de classification ne peut pas dépasser 160 caractères.';
  end if;

  if new.official_category_id is null then
    if new.classification_precision is not null then
      raise exception 'Une précision de classification nécessite une catégorie officielle.';
    end if;
    return new;
  end if;

  select *
  into official_category
  from public.categories
  where id = new.official_category_id
    and is_system
    and owner_id is null
    and official_code is not null
    and official_category_id is null;

  if not found then
    raise exception 'La catégorie de classification doit être une catégorie officielle terminale.';
  end if;

  if (new.transaction_type = 'income' and official_category.usage <> 'income')
     or (new.transaction_type = 'expense' and official_category.usage <> 'expense') then
    raise exception 'La catégorie officielle est incompatible avec le type de l’opération.';
  end if;

  is_new_assignment := tg_op = 'INSERT'
    or new.official_category_id is distinct from old.official_category_id;

  if is_new_assignment and not official_category.active then
    raise exception 'Une catégorie officielle inactive ne peut pas être attribuée.';
  end if;

  if new.classification_precision is not null
     and not official_category.requires_precision then
    raise exception 'Cette catégorie officielle n’accepte pas de précision.';
  end if;

  return new;
end;
$$;

-- Les noms imposent la normalisation avant la validation et avant les autres
-- triggers BEFORE existants, exécutés lexicalement par PostgreSQL.
create trigger transactions_10_normalize_classification
before insert or update on public.transactions
for each row execute function public.normalize_transaction_classification();

create trigger transactions_20_validate_classification
before insert or update on public.transactions
for each row execute function public.validate_transaction_classification();

revoke all on function public.normalize_transaction_classification() from public;
revoke all on function public.validate_transaction_classification() from public;

comment on column public.categories.requires_precision is
  'Indique qu’une catégorie officielle terminale nécessite une précision portée par l’opération.';
comment on column public.transactions.accounting_nature is
  'Nature comptable : ordinary ou capital_movement pour une recette ou une dépense ; NULL pour un transfert.';
comment on column public.transactions.official_category_id is
  'Catégorie officielle historique portée directement par l’opération.';
comment on column public.transactions.classification_precision is
  'Précision historique de classification, normalisée et limitée à 160 caractères.';
