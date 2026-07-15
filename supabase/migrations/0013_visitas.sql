-- Migração 0013 — Contagem anônima de visitas à landing (funil de conversão)
-- Execute no SQL Editor do Supabase APÓS as migrações anteriores.
--
-- O que faz:
--   1. Cria a tabela visitas_landing: UMA linha por visita, só com data e as
--      UTMs da campanha. NENHUM dado pessoal — sem IP, sem user-agent, sem
--      cookie, sem identificador. Por isso a contagem não depende de
--      consentimento (LGPD): não há titular identificável.
--   2. Cria a RPC registrar_visita() (SECURITY DEFINER, grant anon) — a
--      landing chama uma vez por sessão de navegação.
--   3. Recria metricas_painel() acrescentando, em cada linha de "origens",
--      a contagem de "visitas" do período (pra calcular a conversão) e a
--      chave "visitas_periodo" com o total.
--
-- É idempotente: pode ser reexecutado sem erro.

create table if not exists public.visitas_landing (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  utm_source text,
  utm_medium text,
  utm_campaign text
);

-- RLS ligado e sem policy: ninguém lê nem escreve direto (nem anon, nem
-- authenticated). Escrita só pela RPC (definer); leitura só agregada pela
-- metricas_painel (service_role).
alter table public.visitas_landing enable row level security;

create index if not exists visitas_landing_created_at_idx
  on public.visitas_landing (created_at);

create or replace function public.registrar_visita(
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.visitas_landing (utm_source, utm_medium, utm_campaign)
  values (
    nullif(left(trim(p_utm_source), 80), ''),
    nullif(left(trim(p_utm_medium), 80), ''),
    nullif(left(trim(p_utm_campaign), 80), '')
  );
$$;

grant execute on function
  public.registrar_visita(text, text, text) to anon;

-- 3. metricas_painel com visitas e conversão por origem.
create or replace function public.metricas_painel(p_dias int default 30)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with base as (
    select
      (created_at at time zone 'America/Sao_Paulo')::date as dia,
      created_at,
      utm_source,
      utm_medium,
      utm_campaign
    from public.inscricoes
  ),
  ref as (
    select (now() at time zone 'America/Sao_Paulo')::date as hoje
  ),
  insc_origem as (
    select
      coalesce(utm_source, '') as s,
      coalesce(utm_medium, '') as m,
      coalesce(utm_campaign, '') as c,
      count(*) as total
    from base, ref
    where base.dia > ref.hoje - greatest(p_dias, 1)
    group by 1, 2, 3
  ),
  visita_origem as (
    select
      coalesce(utm_source, '') as s,
      coalesce(utm_medium, '') as m,
      coalesce(utm_campaign, '') as c,
      count(*) as total
    from public.visitas_landing, ref
    where (created_at at time zone 'America/Sao_Paulo')::date
            > ref.hoje - greatest(p_dias, 1)
    group by 1, 2, 3
  )
  select jsonb_build_object(
    'total',  (select count(*) from base),
    'hoje',   (select count(*) from base, ref where base.dia = ref.hoje),
    'semana', (select count(*) from base, ref where base.dia > ref.hoje - 7),
    'ultima', (select max(created_at) from base),
    'serie',  coalesce((
      select jsonb_agg(
               jsonb_build_object('dia', d.dia, 'total', coalesce(c.total, 0))
               order by d.dia
             )
      from (
        select generate_series(
                 (select hoje from ref) - (greatest(p_dias, 1) - 1),
                 (select hoje from ref),
                 interval '1 day'
               )::date as dia
      ) d
      left join (
        select dia, count(*) as total from base group by dia
      ) c on c.dia = d.dia
    ), '[]'::jsonb),
    'visitas_periodo', (select coalesce(sum(total), 0) from visita_origem),
    'origens', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'source',   nullif(k.s, ''),
                 'medium',   nullif(k.m, ''),
                 'campaign', nullif(k.c, ''),
                 'total',    coalesce(i.total, 0),
                 'visitas',  coalesce(v.total, 0)
               )
               order by coalesce(i.total, 0) desc, coalesce(v.total, 0) desc
             )
      from (
        select s, m, c from (
          select s, m, c, coalesce((select i2.total from insc_origem i2
                   where i2.s = u.s and i2.m = u.m and i2.c = u.c), 0) as peso
          from (
            select s, m, c from insc_origem
            union
            select s, m, c from visita_origem
          ) u
          order by peso desc
          limit 20
        ) topo
      ) k
      left join insc_origem   i on i.s = k.s and i.m = k.m and i.c = k.c
      left join visita_origem v on v.s = k.s and v.m = k.m and v.c = k.c
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.metricas_painel(int) from public, anon, authenticated;
grant execute on function public.metricas_painel(int) to service_role;
