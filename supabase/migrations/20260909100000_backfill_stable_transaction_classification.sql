begin;

-- The lock makes the preimage assertions and the following backfill atomic with
-- respect to concurrent transaction writes while still allowing normal reads.
lock table public.transactions in share row exclusive mode;

do $migration$
declare
  transaction_total bigint;
  affected_rows bigint;
  expected_rows bigint;
  updated_at_preimage jsonb;
  updated_at_preimage_count bigint;
  updated_at_changed_count bigint;
  group_row record;

  -- A fingerprint is md5(protected_person_id | financial_account_id | date |
  -- transaction_type | normalized amount | exact label | category_id |
  -- transfer_id). Normalizing trailing decimal zeroes reproduces the numeric
  -- representation of the audited JSON without converting through float.
  -- UUID remains separate so duplicate business fingerprints stay distinct.
  mig03_transactions constant jsonb := $json$[
    ["8b37de7e-820b-4925-8c23-bff2c8bb958b","245c43d045244cfdfe8bd5cf9e0cca91"],
    ["ff3c610d-5601-4cf3-9ab4-2f7d0854eed7","d6b51f268841cf6780ecbd965006d6eb"],
    ["137752c4-6e97-41a4-992e-51ba15c19344","7275bfb725b2441c6f1f9b98c0ef2238"],
    ["55d36087-c846-45eb-9796-dff56ebd0d87","04c978e47f6259bb50ec4c3c54c85ffb"],
    ["c663078f-ee3c-4d97-93bb-d8b796da80ea","ad3bc19fa7b101942fb203e1dd149c59"],
    ["0ae4b1fc-2d85-4cea-8606-d0784294bd9a","c4522e993e5be2d5d91231224766430a"],
    ["110270b9-ccf5-4408-8d04-aa3816cb5bb6","ab648e3efca894fc28a29cceaf612b09"],
    ["47b1c9a3-5d2d-4947-b78e-069d0863d47e","3547738e90d4d4e2ed0bda55e14e26de"],
    ["b407629c-d932-43b0-9d94-e9f2fdb0e3b4","2f042c97caa93c2e1109fe6389c9a5bf"],
    ["b8148399-757a-44c2-96e4-51c00bd47627","70ae75d75b72fa30b75fc95ecfcd069d"],
    ["06677066-c315-424b-a608-61c124b093bc","9653effe45afb3ad7c16a961b0e13263"],
    ["91b3922d-4e9b-4f3a-b8f2-e88b5fd25b1a","e9f29dc9da8ba78ae0c330af75108a04"],
    ["0a253014-dba5-441b-b6aa-ac65194888ef","526e6bf29a696d76294abfc762c6a141"],
    ["c8bb3b4e-d5bf-406f-851e-137680000234","167689ed8fbddd8363cd05b19d4505d7"],
    ["3e359e2a-fd9f-4149-ae01-089040724809","68eb93b6ed72adcccf2b5d93e881ef81"],
    ["321218c0-9170-42ed-8624-eb763debfcfd","e2bd7cbb6f5ccc7ea3fcdab68c570ca4"],
    ["3f609dcd-c51d-45a1-8212-1744ceb5131b","98bffcbdbf4d9e5498f5ea075ad7cb35"],
    ["33c776dd-b19d-4ec6-8dea-6c9f15aa4751","1979b96b4e0d0b081a6a4354dfe86cd2"],
    ["c7972cbc-c093-45bd-bc93-3abf367f43a8","1979b96b4e0d0b081a6a4354dfe86cd2"],
    ["8892f1de-88fb-4614-b4a2-8d08890da2b0","c16e7b3329aaef62fa9d373f593a8197"],
    ["e0c2ac7e-23d9-4af7-9906-3b520709e009","19d5a05e2d7c3c7972889dd4e93e65c4"],
    ["25c339c0-340c-41f7-8ea4-30b39de49457","b4ff98095a5f36a6664fd7d01ca9f3a6"],
    ["d1d3f6c7-9b36-4d22-86e5-f0077e3e5145","5cd57ff980ae97f1bd10e34cb2fae55f"],
    ["52b01671-bd25-474e-9f4a-56a63659b8cc","49c30f4fa257ce71fbd816c2d381dd0d"],
    ["16275496-25dd-4c85-b81b-cf2e31152d15","591881b32dd9dee200035f011845286f"],
    ["845a13db-5c51-495d-869c-299d47950c15","8e5a5796aa81af946211935edd53a883"],
    ["44c2220b-6e93-4da8-bd7c-8885472b3f11","ed0fe57aa3c95e418a198376cc45ad71"],
    ["6c15c5e3-1f6b-4c08-9d3d-5f62f1913b9f","86928cc663189ab630880ff6efc040f7"],
    ["e1c0f2ab-6bef-4ada-bd96-e8c4f2769eb3","90ad691081466230abb7f4f8f1896ac1"],
    ["822ee26c-d17a-4121-8c28-18600e21a825","73064d87a4ebe6b5ba08f4daaca32067"],
    ["fb696c78-ce51-4b02-ae2b-8da56d1ba69e","f851796815a9dc45f15b568d8aa31221"],
    ["7c3190f0-ee8d-4793-a7e6-ab53a967fe40","df680fa709dea898888189d8a4a1f449"],
    ["5443d18f-5d09-45a7-b02d-165d86bce5bb","f30078c8d31613e7832fa92f87741553"],
    ["39c3ad31-eaef-4a9b-a8dc-552e7ec1853f","d41b129605a40fdd2e19440789f5277f"],
    ["28d2531f-7fba-4bf1-bf35-68073a21c194","a5ac7d93d56a7ef62047f586fdbdc0fc"],
    ["16e62e4f-397a-48a4-9a1b-0f860c0f99de","20057cd331ffbe57de82ca5deef0f9c9"],
    ["1a868338-f4f3-476b-ba32-a3e01b8ad2e7","d590a132ee86bb5b6acc341ac40b3833"],
    ["fe35bb5a-d303-4e28-be7a-7b1e27aaeb3c","c2771b7ba14170f14403f6b77f84afcf"],
    ["4e840ea7-bce9-49b9-9d36-41dca0a8d969","8577356e4dc0cbe1329e9675b395c306"],
    ["1100cdb1-55c5-48d7-822e-6cd8490ba66d","02ed97355cd2c2584fbec5e420e8f8c9"],
    ["f721dd85-0cab-4390-a777-d3e3e801ad25","03bec97856a4f7b445063ceb47f69d88"],
    ["79ec68c7-a8f1-471c-8938-32a5eb95681f","ea439c5854932150247140e0ea3d2392"],
    ["589f5b26-71b0-4956-adcb-c015059b98de","aec99632b198dc98e435c96ae4c14d75"],
    ["a620fae1-78f5-44df-a214-292f7dd6354c","c3cb19b342bbc18ab91a85daebe584d4"],
    ["8607dbf0-9c06-4c0a-89ed-78c94aacffc0","a1b2f65a6039d621ca99c9ace370cc82"],
    ["177c4ac0-52fb-4113-8ea2-0edbefef36e7","6b0599507c17305178eeb9d66fcb61f4"],
    ["9a121c3d-9192-4766-93cd-c1fae12fcb97","b25e73131a50ca387b71d0009e7e6814"],
    ["69fd68a6-4a80-4321-b2e8-74aa2f804307","1e073a644cbefc1c0f5e9e5e9b325859"],
    ["21762c5d-7189-4685-8808-e2021e1c8e2a","1232cd0b4cf229f5ce1cccec6074393b"],
    ["2ddf8414-6dcc-4919-91b6-2689a15ba3c6","a6e3c5b2910e7ef400b4ec69a82ca5b9"],
    ["976da4a0-5a0a-4929-952f-4ca3a4654c61","ae9b712c8c8efac41c6053b580894316"],
    ["80cd2e36-eaea-4f09-8e3d-6a0f3387f51a","517b59fe93a3d1ce2c92bb8efe45e9c6"],
    ["92e2f1b0-fbf0-4f9c-9047-e4b8e2119989","c63c3fd6e15b1d46d70af253a929ecc9"],
    ["53ce2167-51d3-4e8b-9e3f-60c95878d51b","46e199236de96d60325cf9549ca016f6"]
  ]$json$::jsonb;

  mig03_groups constant jsonb := $json$[
    {"name":"Allocation combattant","source":"657d0c7f-7371-4827-b952-2c59ee7f14ae","code":"RES-2-05","precision":"Allocation combattant","count":5},
    {"name":"Charges copropriété","source":"734ebdb4-df4c-4a5c-80ea-8d0a6e7dce3a","code":"DEP-2-07","precision":"Charges copropriété","count":14},
    {"name":"Coiffeur","source":"e70ad9f0-bc73-4475-871e-341cd8e55d60","code":"DEP-1-08","precision":"Coiffeur","count":18},
    {"name":"Frais bancaires","source":"9aaf554e-b662-4c9d-bc64-614528ea14f2","code":"DEP-1-08","precision":"Frais bancaires","count":5},
    {"name":"Notaire","source":"f3609651-67d9-4076-aa07-c82f9356bb8d","code":"DEP-10-03","precision":"Notaire","count":2},
    {"name":"Obsèques","source":"1771acdb-0e35-4c64-9215-07f120b2038e","code":"DEP-10-03","precision":"Obsèques","count":1},
    {"name":"Pédicure","source":"f6011b17-81a4-45ab-a7e0-8de464a7bc3b","code":"DEP-1-08","precision":"Pédicure","count":9}
  ]$json$::jsonb;

  capital_transactions constant jsonb := $json$[
    ["873316c6-f2f7-4462-ab92-0ad25462ddfe","986fa70df0ffb6589598c01a07b323d3"],
    ["17a4c6a3-602f-4567-9bf3-2a4a7101ef3e","4e309db94dbd81a9edac9a25c0af490a"],
    ["caebc34c-01fb-4eb3-a2a0-fc6ed1ecae69","626060d5b69f5f32f6e74f1005482cf6"],
    ["fcc8dd8d-b5af-4fcb-bdde-8f37bba36e8c","af0989d788382ae9e77bd0ac628b8a7d"],
    ["94ae2d93-b8f5-4841-b4c7-e3f1c23aeeb5","a09b042c675eddcfe8ed34b6ae91c6c0"],
    ["1091a37f-4c35-4f96-809c-e97fb71b7579","313c834e7c364fab740a55177b46854e"],
    ["7b7b4217-4b4c-44bd-9364-3ecc9fd01d01","6d5e53b06bb5985e0b137daa1cebdf22"],
    ["22665467-b094-4f25-ae49-d9017b5efb45","0982c6af47f82bf8283f5672d0b920a6"],
    ["0607646e-c115-4a74-9194-8a0c7ccef0a2","0848c2a8bff5104271a4c0998057ce81"],
    ["e8df5dbe-e5aa-4856-8fe6-243d2a0f0e41","0848c2a8bff5104271a4c0998057ce81"],
    ["975bed24-b36c-48c1-9e84-c60817ee43e9","578de54087853725ca37d6ea8425466e"],
    ["29cf81e5-50bb-486c-bf9d-4458fe841c80","f888a39ea2a2b93a3f311b1a9d02accb"],
    ["464ff3e1-ee06-4e2a-a2a3-50efa7a4affd","24e69348841004250b1254a9d8eed4aa"],
    ["5f2c8ab5-cde7-4bf6-9445-c69041ad265a","7e91a3e7e3de7afa56d1a08cb1c37a51"],
    ["72c05e8e-7d36-4fe7-9cdb-430574499992","acc23b9795fc6fe00703424e62cb36fe"],
    ["bbdb9612-3a9e-4264-98c2-d17c98d78851","44bc946b213db99a2ef1bd899a4c3817"],
    ["cce9badd-c0f3-4daf-b683-c6bdc152cc47","44bc946b213db99a2ef1bd899a4c3817"],
    ["d0f8a450-f1b3-49b8-b3f5-3c1f89356423","b4f1e28adb5a961319de2ebf2700e296"]
  ]$json$::jsonb;

  f_transactions constant jsonb := $json$[
    {"id":"4e7b930f-ad4e-4d50-9220-d5f187d19b86","fp":"f6eb0248912e7f1065f217a6d52538ff","code":"DEP-2-07","precision":"Bricolage / entretien du logement"},
    {"id":"5b424f1a-77ce-4a10-8718-00483e694f0e","fp":"939fb2b2c076ac18c24dced33f70fcf7","code":"DEP-1-08","precision":"Laverie"},
    {"id":"5ef2f236-cc19-4870-9a2a-cb7a601049e8","fp":"af19addabe6fdaa7239ac99301f40deb","code":"DEP-2-07","precision":"Bricolage / entretien du logement"},
    {"id":"9f422076-d54d-4685-b388-9920aa9d254c","fp":"795de2691228e6285169275756cdc56a","code":"DEP-2-07","precision":"Diagnostic immobilier"},
    {"id":"f4cae27d-e8cb-4c22-9e2a-cc496ef07f08","fp":"af0127dc4512988fffcb4d08c1c4090c","code":"DEP-2-07","precision":"Bricolage / entretien du logement"},
    {"id":"22f093cb-a57f-46c3-ad7c-a949b31a1158","fp":"863ee43d2b60a7c685a1966e2bf7e10e","code":"DEP-2-07","precision":"Bricolage / entretien du logement"},
    {"id":"0d02ef20-2a75-4e92-bdfd-ddae549edba6","fp":"a1a2acac2e671479682e8f3219360f6b","code":"DEP-2-07","precision":"Bricolage / entretien du logement"},
    {"id":"dd08d565-e57b-496c-913f-ae9f1492f657","fp":"d7b24b04737352c34cd1b03cfbd2b2ca","code":"RES-4-03","precision":null},
    {"id":"625173a4-8a58-4353-96a9-745a1ff9b8fa","fp":"f1fac3c445271fe811dead9b3c244dda","code":"DEP-3-03","precision":null},
    {"id":"2351a23d-20bf-4dd2-8aa7-b13c345ac727","fp":"5b2f2f57f5a6025bb274d6323d7b3f6a","code":"DEP-1-08","precision":"Fournitures de bureau"},
    {"id":"11f9606e-7e4a-4a3e-88f2-f7028ed5178b","fp":"d157ab329b9b2a03f075820cc7c1d9b5","code":"DEP-1-08","precision":"Fournitures de bureau"},
    {"id":"088ba77b-8b59-4a3e-9235-a8dcc56804c1","fp":"08b92d2d718d55f9ab28930600744fce","code":"DEP-2-07","precision":"Bricolage / entretien du logement"},
    {"id":"a9f0daa0-0814-4b57-9051-b0a07e5b28f8","fp":"baa27abcea1a9f1b4741971a8255b12b","code":"DEP-1-04","precision":null}
  ]$json$::jsonb;

  expected_target_ids constant jsonb := $json${
    "RES-2-05":"18c3a5a8-df88-4827-9701-067ca82a2791",
    "DEP-1-08":"3316035d-16d6-44ce-b4b3-0230937a136d",
    "DEP-2-07":"81882c85-edd0-4951-98a0-bb01b64d4fc2",
    "DEP-10-03":"dc7892e4-7ea8-48a3-8e5e-e98e841a5fbd",
    "RES-4-03":"f130e9a1-824f-4d16-9ffe-795fd04e2fec",
    "DEP-3-03":"adcc9a65-861f-4402-8ac5-205384c939f9",
    "DEP-1-04":"9fda7a4f-8465-4d99-a073-455aebb36c7b"
  }$json$::jsonb;
begin
  select count(*) into transaction_total from public.transactions;

  -- A freshly reconstructed local database contains no historical data.
  if transaction_total = 0 then
    return;
  end if;

  -- Exact A1H preimage. This also deliberately rejects a second populated run.
  if transaction_total <> 582
     or (select count(*) from public.transactions where category_id is not null) <> 521
     or (select count(*) from public.transactions where category_id is null) <> 61
     or (select count(*) from public.transactions where transfer_id is not null) <> 42
     or (select count(*) from public.transactions where transfer_id is null) <> 540
     or (select count(*) from public.transactions where accounting_nature is not null) <> 0
     or (select count(*) from public.transactions where official_category_id is not null) <> 0
     or (select count(*) from public.transactions where classification_precision is not null) <> 0 then
    raise exception 'MIG-10: la préimage A1H des transactions ne correspond pas.';
  end if;

  -- The seven official targets are environment-specific UUIDs. In historical
  -- mode they must still match the exact remote A1H snapshot.
  if (select count(*) from public.categories c
      where c.official_code in ('RES-2-05','DEP-1-08','DEP-2-07','DEP-10-03','RES-4-03','DEP-3-03','DEP-1-04')
        and c.id = (expected_target_ids ->> c.official_code)::uuid
        and c.is_system and c.owner_id is null and c.official_category_id is null
        and c.active) <> 7 then
    raise exception 'MIG-10: les cibles officielles A1H ont dérivé.';
  end if;

  if (select count(*) from public.categories where is_system and official_code is not null) <> 56
     or (select count(*) from public.categories where is_system and official_code is not null and active) <> 56
     or (select count(*) from public.categories where is_system and official_code is not null and usage = 'income') <> 18
     or (select count(*) from public.categories where is_system and official_code is not null and usage = 'expense') <> 38
     or (select count(*) from public.categories where is_system and official_code is not null and requires_precision) <> 13 then
    raise exception 'MIG-10: le référentiel officiel ne correspond pas à A1H.';
  end if;

  -- Structured transfers are asserted but never updated.
  if (select count(*) from public.transfers) <> 21
     or (select count(*) from public.transactions where transfer_id is not null) <> 42
     or exists (
       select 1
       from public.transfers tr
       left join lateral (
         select count(*) as leg_count,
                count(*) filter (where t.transaction_type = 'transfer_out') as out_count,
                count(*) filter (where t.transaction_type = 'transfer_in') as in_count,
                bool_and(
                  t.category_id is null and t.accounting_nature is null
                  and t.official_category_id is null and t.classification_precision is null
                  and t.transaction_date = tr.transfer_date and t.amount = tr.amount
                  and ((t.transaction_type = 'transfer_out' and t.financial_account_id = tr.source_account_id)
                    or (t.transaction_type = 'transfer_in' and t.financial_account_id = tr.destination_account_id))
                ) as valid_legs
         from public.transactions t where t.transfer_id = tr.id
       ) legs on true
       where legs.leg_count <> 2 or legs.out_count <> 1 or legs.in_count <> 1
          or legs.valid_legs is distinct from true
     ) then
    raise exception 'MIG-10: les 21 transferts structurés ne correspondent pas à A1H.';
  end if;

  -- Canonical transaction fingerprints for every exceptional manifest.
  if (select count(*) from jsonb_array_elements(mig03_transactions)) <> 54
     or exists (
       select 1
       from jsonb_array_elements(mig03_transactions) item
       left join public.transactions t on t.id = (item ->> 0)::uuid
       left join public.financial_accounts a on a.id = t.financial_account_id
       where t.id is null
          or md5(concat_ws('|', a.protected_person_id::text, t.financial_account_id::text,
               t.transaction_date::text, t.transaction_type,
               trim(trailing '.' from trim(trailing '0' from t.amount::text)), t.label,
               coalesce(t.category_id::text, ''), coalesce(t.transfer_id::text, ''))) <> item ->> 1
          or t.accounting_nature is not null or t.official_category_id is not null
          or t.classification_precision is not null or t.transfer_id is not null
     ) then
    raise exception 'MIG-10: le manifeste transactionnel MIG-03 a dérivé.';
  end if;

  if (select count(*) from jsonb_array_elements(mig03_groups)) <> 7
     or exists (
       select 1
       from jsonb_to_recordset(mig03_groups)
         as g(name text, source uuid, code text, precision text, count bigint)
       left join public.categories source on source.id = g.source
       left join public.categories target on target.official_code = g.code
       where source.id is null or source.is_system or source.owner_id is null
          or source.official_code is not null or source.official_category_id is distinct from target.id
          or source.usage is distinct from target.usage
          or target.id is null or target.id <> (expected_target_ids ->> g.code)::uuid
          or not target.is_system or target.owner_id is not null or target.official_code is null
          or target.official_category_id is not null or not target.active
          or not target.requires_precision or nullif(btrim(g.precision), '') is null
          or (select count(*)
              from public.transactions t
              where t.category_id = g.source
                and exists (
                  select 1 from jsonb_array_elements(mig03_transactions) item
                  where (item ->> 0)::uuid = t.id
                )) <> g.count
     ) then
    raise exception 'MIG-10: les sept groupes et presets sources MIG-03 ont dérivé.';
  end if;

  if (select count(*) from jsonb_array_elements(capital_transactions)) <> 18
     or exists (
       select 1
       from jsonb_array_elements(capital_transactions) item
       left join public.transactions t on t.id = (item ->> 0)::uuid
       left join public.financial_accounts a on a.id = t.financial_account_id
       where t.id is null
          or md5(concat_ws('|', a.protected_person_id::text, t.financial_account_id::text,
               t.transaction_date::text, t.transaction_type,
               trim(trailing '.' from trim(trailing '0' from t.amount::text)), t.label,
               coalesce(t.category_id::text, ''), coalesce(t.transfer_id::text, ''))) <> item ->> 1
          or t.category_id is not null or t.transfer_id is not null
          or t.accounting_nature is not null or t.official_category_id is not null
          or t.classification_precision is not null
     ) then
    raise exception 'MIG-10: le manifeste des 18 mouvements de capital a dérivé.';
  end if;

  if (select count(*) from jsonb_array_elements(f_transactions)) <> 13
     or exists (
       select 1
       from jsonb_array_elements(f_transactions) item
       left join public.transactions t on t.id = (item ->> 'id')::uuid
       left join public.financial_accounts a on a.id = t.financial_account_id
       left join public.categories legacy on legacy.id = t.category_id
       left join public.categories target on target.official_code = item ->> 'code'
       where t.id is null
          or md5(concat_ws('|', a.protected_person_id::text, t.financial_account_id::text,
               t.transaction_date::text, t.transaction_type,
               trim(trailing '.' from trim(trailing '0' from t.amount::text)), t.label,
               coalesce(t.category_id::text, ''), coalesce(t.transfer_id::text, ''))) <> item ->> 'fp'
          or t.transfer_id is not null or t.accounting_nature is not null
          or t.official_category_id is not null or t.classification_precision is not null
          or legacy.id is null or not legacy.is_system or legacy.owner_id is not null
          or legacy.official_code is null or legacy.official_category_id is not null
          or legacy.usage is distinct from t.transaction_type
          or target.id is null or target.id <> (expected_target_ids ->> (item ->> 'code'))::uuid
          or not target.is_system or target.owner_id is not null or target.official_code is null
          or target.official_category_id is not null or not target.active
          or target.usage is distinct from t.transaction_type
          or target.requires_precision is distinct from ((item -> 'precision') <> 'null'::jsonb)
     ) then
    raise exception 'MIG-10: le manifeste des 13 classifications validées a dérivé.';
  end if;

  -- U19 is a validated ordinary reimbursement.
  if not exists (
    select 1 from public.transactions t
    join public.financial_accounts a on a.id = t.financial_account_id
    where t.id = '93ee96e8-a977-4b3e-b80c-8ed8399cb2d9'
      and md5(concat_ws('|', a.protected_person_id::text, t.financial_account_id::text,
          t.transaction_date::text, t.transaction_type,
          trim(trailing '.' from trim(trailing '0' from t.amount::text)), t.label,
          coalesce(t.category_id::text, ''), coalesce(t.transfer_id::text, '')))
          = '49e7ba3f4d65ba475e07d811249c5577'
      and t.category_id is null and t.transfer_id is null
      and t.accounting_nature is null and t.official_category_id is null
      and t.classification_precision is null
  ) then
    raise exception 'MIG-10: la préimage U19 a dérivé.';
  end if;

  -- E01 is deliberately left entirely outside every update.
  if not exists (
    select 1 from public.transactions t
    join public.financial_accounts a on a.id = t.financial_account_id
    where t.id = '1e7dd571-86f3-4ff0-a78c-1a04ac2c73d8'
      and md5(concat_ws('|', a.protected_person_id::text, t.financial_account_id::text,
          t.transaction_date::text, t.transaction_type,
          trim(trailing '.' from trim(trailing '0' from t.amount::text)), t.label,
          coalesce(t.category_id::text, ''), coalesce(t.transfer_id::text, '')))
          = 'b516b43ca61969fc7da09b7fbee617b4'
      and t.category_id = '81882c85-edd0-4951-98a0-bb01b64d4fc2'
      and t.accounting_nature is null and t.official_category_id is null
      and t.classification_precision is null and t.transfer_id is null
  ) then
    raise exception 'MIG-10: la préimage E01 a dérivé.';
  end if;

  -- Generic direct official categories: every ambiguous F/E UUID is excluded.
  select count(*) into expected_rows
  from public.transactions t
  join public.categories c on c.id = t.category_id
  where t.transaction_type in ('income','expense') and t.transfer_id is null
    and c.is_system and c.owner_id is null and c.official_code is not null
    and c.official_category_id is null and c.active and not c.requires_precision
    and c.usage = t.transaction_type
    and t.accounting_nature is null and t.official_category_id is null
    and t.classification_precision is null
    and t.id <> '1e7dd571-86f3-4ff0-a78c-1a04ac2c73d8'
    and not exists (select 1 from jsonb_array_elements(f_transactions) item where (item ->> 'id')::uuid = t.id);
  if expected_rows <> 445 then
    raise exception 'MIG-10: le bloc système direct doit contenir 445 lignes, trouvé %.', expected_rows;
  end if;

  -- Generic presets: validated target only, never an implicit precision from the preset name.
  select count(*) into expected_rows
  from public.transactions t
  join public.categories source on source.id = t.category_id
  join public.categories target on target.id = source.official_category_id
  join public.financial_accounts a on a.id = t.financial_account_id
  join public.protected_persons p on p.id = a.protected_person_id
  where t.transaction_type in ('income','expense') and t.transfer_id is null
    and not source.is_system and source.owner_id is not null and source.owner_id = p.owner_id
    and target.is_system and target.owner_id is null and target.official_code is not null
    and target.official_category_id is null and target.active and not target.requires_precision
    and source.usage = t.transaction_type and target.usage = t.transaction_type
    and t.accounting_nature is null and t.official_category_id is null
    and t.classification_precision is null
    and not exists (select 1 from jsonb_array_elements(mig03_transactions) item where (item ->> 0)::uuid = t.id);
  if expected_rows <> 8 then
    raise exception 'MIG-10: le bloc preset générique doit contenir 8 lignes, trouvé %.', expected_rows;
  end if;

  -- Keep a transaction-local snapshot of every historical timestamp. The exact
  -- A1H preimage contains 582 unique transaction UUIDs, so no temporary table or
  -- permanent write is needed to prove that the 539 backfilled rows retain it.
  select jsonb_object_agg(t.id::text, to_jsonb(t.updated_at))
  into updated_at_preimage
  from public.transactions t;

  select count(*)
  into updated_at_preimage_count
  from jsonb_object_keys(updated_at_preimage);

  if updated_at_preimage_count <> 582 then
    raise exception 'MIG-10: la photographie updated_at doit contenir 582 lignes.';
  end if;

  if (select count(*)
    from pg_catalog.pg_trigger trg
    join pg_catalog.pg_class relation on relation.oid = trg.tgrelid
    join pg_catalog.pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public' and relation.relname = 'transactions'
      and trg.tgname in (
        'transactions_validate',
        'transactions_protect_closed_period',
        'transactions_set_updated_at',
        'transactions_10_normalize_classification',
        'transactions_20_validate_classification'
      )
      and not trg.tgisinternal and trg.tgenabled = 'O'
  ) <> 5 then
    raise exception 'MIG-10: les cinq triggers requis de transactions doivent être présents et actifs.';
  end if;

  -- These are the only pre-existing triggers suspended. The historical account-date
  -- validation rejects one known legacy row although MIG-10 does not change its account
  -- or date. The MIG-09 normalization and validation triggers remain active throughout.
  execute 'alter table public.transactions disable trigger transactions_validate';
  execute 'alter table public.transactions disable trigger transactions_protect_closed_period';
  execute 'alter table public.transactions disable trigger transactions_set_updated_at';

  update public.transactions t
  set accounting_nature = 'ordinary', official_category_id = t.category_id,
      classification_precision = null
  from public.categories c
  where c.id = t.category_id
    and t.transaction_type in ('income','expense') and t.transfer_id is null
    and c.is_system and c.owner_id is null and c.official_code is not null
    and c.official_category_id is null and c.active and not c.requires_precision
    and c.usage = t.transaction_type
    and t.accounting_nature is null and t.official_category_id is null
    and t.classification_precision is null
    and t.id <> '1e7dd571-86f3-4ff0-a78c-1a04ac2c73d8'
    and not exists (select 1 from jsonb_array_elements(f_transactions) item where (item ->> 'id')::uuid = t.id);
  get diagnostics affected_rows = row_count;
  if affected_rows <> 445 then raise exception 'MIG-10: 445 écritures système attendues, % modifiées.', affected_rows; end if;

  update public.transactions t
  set accounting_nature = 'ordinary', official_category_id = target.id,
      classification_precision = null
  from public.categories source
  join public.categories target on target.id = source.official_category_id
  join public.financial_accounts a on true
  join public.protected_persons p on p.id = a.protected_person_id
  where source.id = t.category_id and a.id = t.financial_account_id
    and t.transaction_type in ('income','expense') and t.transfer_id is null
    and not source.is_system and source.owner_id is not null and source.owner_id = p.owner_id
    and target.is_system and target.owner_id is null and target.official_code is not null
    and target.official_category_id is null and target.active and not target.requires_precision
    and source.usage = t.transaction_type and target.usage = t.transaction_type
    and t.accounting_nature is null and t.official_category_id is null
    and t.classification_precision is null
    and not exists (select 1 from jsonb_array_elements(mig03_transactions) item where (item ->> 0)::uuid = t.id);
  get diagnostics affected_rows = row_count;
  if affected_rows <> 8 then raise exception 'MIG-10: 8 écritures preset attendues, % modifiées.', affected_rows; end if;

  -- MIG-03 is updated one validated group at a time and each ROW_COUNT is guarded.
  for group_row in
    select * from jsonb_to_recordset(mig03_groups)
      as g(name text, source uuid, code text, precision text, count bigint)
  loop
    update public.transactions t
    set accounting_nature = 'ordinary', official_category_id = target.id,
        classification_precision = group_row.precision
    from public.categories target
    where target.official_code = group_row.code
      and target.id = (expected_target_ids ->> group_row.code)::uuid
      and target.is_system and target.owner_id is null and target.official_category_id is null
      and target.active and target.requires_precision and target.usage = t.transaction_type
      and t.category_id = group_row.source and t.transfer_id is null
      and t.accounting_nature is null and t.official_category_id is null
      and t.classification_precision is null
      and exists (select 1 from jsonb_array_elements(mig03_transactions) item where (item ->> 0)::uuid = t.id);
    get diagnostics affected_rows = row_count;
    if affected_rows <> group_row.count then
      raise exception 'MIG-10: groupe MIG-03 % attendu %, modifié %.', group_row.name, group_row.count, affected_rows;
    end if;
  end loop;

  update public.transactions t
  set accounting_nature = 'ordinary', official_category_id = target.id,
      classification_precision = null
  from public.categories target
  where t.id = '93ee96e8-a977-4b3e-b80c-8ed8399cb2d9'
    and target.official_code = 'RES-4-03'
    and target.id = (expected_target_ids ->> 'RES-4-03')::uuid
    and target.is_system and target.owner_id is null and target.official_category_id is null
    and target.active and target.usage = 'income' and not target.requires_precision
    and t.category_id is null and t.transfer_id is null
    and t.accounting_nature is null and t.official_category_id is null
    and t.classification_precision is null;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then raise exception 'MIG-10: U19 doit modifier exactement une ligne.'; end if;

  update public.transactions t
  set accounting_nature = 'capital_movement', category_id = null,
      official_category_id = null, classification_precision = null
  where exists (select 1 from jsonb_array_elements(capital_transactions) item where (item ->> 0)::uuid = t.id)
    and t.category_id is null and t.transfer_id is null
    and t.accounting_nature is null and t.official_category_id is null
    and t.classification_precision is null;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 18 then raise exception 'MIG-10: 18 mouvements de capital attendus, % modifiés.', affected_rows; end if;

  update public.transactions t
  set accounting_nature = 'ordinary', official_category_id = target.id,
      classification_precision = nullif(item ->> 'precision', '')
  from jsonb_array_elements(f_transactions) item
  join public.categories target on target.official_code = item ->> 'code'
  where t.id = (item ->> 'id')::uuid
    and target.id = (expected_target_ids ->> (item ->> 'code'))::uuid
    and target.is_system and target.owner_id is null and target.official_category_id is null
    and target.active and target.usage = t.transaction_type
    and target.requires_precision = ((item -> 'precision') <> 'null'::jsonb)
    and t.transfer_id is null and t.accounting_nature is null
    and t.official_category_id is null and t.classification_precision is null;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 13 then raise exception 'MIG-10: 13 classifications validées attendues, % modifiées.', affected_rows; end if;

  execute 'alter table public.transactions enable trigger transactions_set_updated_at';
  execute 'alter table public.transactions enable trigger transactions_protect_closed_period';
  execute 'alter table public.transactions enable trigger transactions_validate';

  if (select count(*)
    from pg_catalog.pg_trigger trg
    join pg_catalog.pg_class relation on relation.oid = trg.tgrelid
    join pg_catalog.pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public' and relation.relname = 'transactions'
      and trg.tgname in (
        'transactions_validate',
        'transactions_protect_closed_period',
        'transactions_set_updated_at',
        'transactions_10_normalize_classification',
        'transactions_20_validate_classification'
      )
      and not trg.tgisinternal and trg.tgenabled = 'O'
  ) <> 5 then
    raise exception 'MIG-10: les cinq triggers requis de transactions ne sont pas tous actifs après le backfill.';
  end if;

  select count(*)
  into updated_at_changed_count
  from public.transactions t
  where to_jsonb(t.updated_at) is distinct from (updated_at_preimage -> t.id::text);

  if updated_at_changed_count <> 0 then
    raise exception 'MIG-10: % timestamps updated_at historiques ont changé.', updated_at_changed_count;
  end if;

  -- E01 must remain byte-for-byte equivalent on its business fingerprint and
  -- retain its entirely null stable classification.
  if not exists (
    select 1 from public.transactions t
    join public.financial_accounts a on a.id = t.financial_account_id
    where t.id = '1e7dd571-86f3-4ff0-a78c-1a04ac2c73d8'
      and md5(concat_ws('|', a.protected_person_id::text, t.financial_account_id::text,
          t.transaction_date::text, t.transaction_type,
          trim(trailing '.' from trim(trailing '0' from t.amount::text)), t.label,
          coalesce(t.category_id::text, ''), coalesce(t.transfer_id::text, '')))
          = 'b516b43ca61969fc7da09b7fbee617b4'
      and t.category_id = '81882c85-edd0-4951-98a0-bb01b64d4fc2'
      and t.accounting_nature is null and t.official_category_id is null
      and t.classification_precision is null and t.transfer_id is null
  ) then
    raise exception 'MIG-10: E01 ne doit pas être modifié.';
  end if;

  -- Historical postconditions and mutually exclusive MIG-09 shapes.
  if (select count(*) from public.transactions) <> 582
     or (select count(*) from public.transactions where transaction_type in ('transfer_in','transfer_out')
          and transfer_id is not null and category_id is null and accounting_nature is null
          and official_category_id is null and classification_precision is null) <> 42
     or (select count(*) from public.transactions where transaction_type in ('income','expense')
          and accounting_nature = 'capital_movement' and transfer_id is null and category_id is null
          and official_category_id is null and classification_precision is null) <> 18
     or (select count(*) from public.transactions where transaction_type in ('income','expense')
          and accounting_nature = 'ordinary' and category_id is not null
          and official_category_id is not null and transfer_id is null) <> 520
     or (select count(*) from public.transactions where transaction_type in ('income','expense')
          and accounting_nature = 'ordinary' and category_id is null
          and official_category_id is not null and transfer_id is null) <> 1
     or (select count(*) from public.transactions where transaction_type in ('income','expense')
          and accounting_nature = 'ordinary' and official_category_id is null) <> 0
     or (select count(*) from public.transactions where transaction_type in ('income','expense')
          and accounting_nature is null and official_category_id is null
          and classification_precision is null) <> 1 then
    raise exception 'MIG-10: les formes MIG-09 finales ne correspondent pas.';
  end if;

  if (select count(*) from public.transactions where accounting_nature = 'ordinary') <> 521
     or (select count(*) from public.transactions where accounting_nature = 'capital_movement') <> 18
     or (select count(*) from public.transactions where accounting_nature is null) <> 43
     or (select count(*) from public.transactions where official_category_id is not null) <> 521
     or (select count(*) from public.transactions where official_category_id is null) <> 61
     or (select count(*) from public.transactions where classification_precision is not null) <> 64
     or (select count(*) from public.transactions where classification_precision is null) <> 518
     or (select count(*) from public.transactions where category_id is not null) <> 521
     or (select count(*) from public.transactions where transfer_id is not null) <> 42 then
    raise exception 'MIG-10: les cardinalités finales des colonnes ne correspondent pas.';
  end if;

  if exists (
    select 1
    from public.transactions t
    left join public.categories target on target.id = t.official_category_id
    where (t.official_category_id is not null and (
             target.id is null or not target.is_system or target.owner_id is not null
             or target.official_code is null or target.official_category_id is not null
             or target.usage is distinct from t.transaction_type
           ))
       or (t.classification_precision is not null and not target.requires_precision)
       or (t.official_category_id is not null and target.requires_precision
             and t.classification_precision is null)
       or (t.accounting_nature = 'capital_movement' and (
             t.category_id is not null or t.transfer_id is not null
             or t.official_category_id is not null or t.classification_precision is not null
           ))
       or (t.transaction_type in ('transfer_in','transfer_out') and (
             t.transfer_id is null or t.category_id is not null or t.accounting_nature is not null
             or t.official_category_id is not null or t.classification_precision is not null
           ))
  ) then
    raise exception 'MIG-10: une forme finale est incohérente.';
  end if;
end;
$migration$;

commit;
