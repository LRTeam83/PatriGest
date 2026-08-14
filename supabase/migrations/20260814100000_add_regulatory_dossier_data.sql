alter table public.protected_persons
  add column residence_address_line1 text,
  add column residence_address_line2 text,
  add column residence_postal_code text,
  add column residence_city text,
  add column residence_country text;

alter table public.protected_persons
  add constraint protected_persons_residence_consistency check (
    residence_address_line1 is not null
    or residence_address_line2 is null
       and residence_postal_code is null
       and residence_city is null
       and residence_country is null
  );

alter table public.protection_measures
  add column court_cabinet text,
  add column representative_first_name text,
  add column representative_last_name text,
  add column representative_appointment_date date,
  add column representative_address_line1 text,
  add column representative_address_line2 text,
  add column representative_postal_code text,
  add column representative_city text,
  add column representative_country text,
  add column representative_phone text,
  add column representative_email text;

alter table public.protection_measures
  drop constraint protection_measures_measure_type_check,
  add constraint protection_measures_measure_type_check check (measure_type in (
    'safeguard_of_justice',
    'safeguard_with_special_mandate',
    'simple_curatorship',
    'reinforced_curatorship',
    'guardianship',
    'future_protection_mandate',
    'family_authorization',
    'judicial_support_measure'
  )),
  add constraint protection_measures_representative_consistency check (
    representative_first_name is not null
    or representative_last_name is null
       and representative_appointment_date is null
       and representative_address_line1 is null
       and representative_address_line2 is null
       and representative_postal_code is null
       and representative_city is null
       and representative_country is null
       and representative_phone is null
       and representative_email is null
  );

comment on column public.protected_persons.residence_address_line1 is
  'Lieu de résidence permanent lorsqu’il est distinct du domicile.';
comment on column public.protection_measures.case_reference is
  'Numéro RG de la procédure ou de la mesure.';
comment on column public.protection_measures.court_cabinet is
  'Cabinet rattaché à la procédure ou à la mesure.';
comment on column public.protection_measures.representative_appointment_date is
  'Date de nomination de la personne en charge de la mesure.';
