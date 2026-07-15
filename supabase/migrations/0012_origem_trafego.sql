-- Migração 0012 — Origem de tráfego das inscrições (UTMs das campanhas)
-- Execute no SQL Editor do Supabase APÓS as migrações anteriores.
--
-- O que faz:
--   1. Adiciona utm_source/utm_medium/utm_campaign em inscricoes — capturadas
--      na landing (anúncios da Meta usam UTMs na URL) e gravadas junto com a
--      inscrição. Nulas = acesso direto/orgânico. Nenhum dado pessoal novo.
--   2. Recria criar_inscricao() com os 3 parâmetros opcionais (default null).
--      A assinatura antiga de 4 argumentos é REMOVIDA para o PostgREST não se
--      perder com sobrecarga; chamadas antigas seguem funcionando porque os
--      novos parâmetros têm default.
--   3. Recria metricas_painel() acrescentando a chave "origens": inscrições
--      do período agrupadas por source/medium/campaign (top 20). O app trata
--      a ausência da chave (migração ainda não aplicada) escondendo a seção.
--
-- É idempotente: pode ser reexecutado sem erro.

alter table public.inscricoes
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;

-- 2. criar_inscricao com origem opcional (remove a assinatura antiga).
drop function if exists public.criar_inscricao(text, text, text, text);

create or replace function public.criar_inscricao(
  p_nome text,
  p_cpf text,
  p_email text,
  p_telefone text,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_matricula text;
begin
  insert into public.inscricoes
    (nome, cpf, email, telefone, utm_source, utm_medium, utm_campaign)
  values
    (p_nome, p_cpf, p_email, p_telefone,
     nullif(left(trim(p_utm_source), 80), ''),
     nullif(left(trim(p_utm_medium), 80), ''),
     nullif(left(trim(p_utm_campaign), 80), ''))
  returning matricula into v_matricula;

  return v_matricula;
end;
$$;

grant execute on function
  public.criar_inscricao(text, text, text, text, text, text, text) to anon;

-- 3. metricas_painel com o agregado de origens do período.
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
    'origens', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'source', o.utm_source,
                 'medium', o.utm_medium,
                 'campaign', o.utm_campaign,
                 'total', o.total
               )
               order by o.total desc
             )
      from (
        select utm_source, utm_medium, utm_campaign, count(*) as total
        from base, ref
        where base.dia > ref.hoje - greatest(p_dias, 1)
        group by utm_source, utm_medium, utm_campaign
        order by count(*) desc
        limit 20
      ) o
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.metricas_painel(int) from public, anon, authenticated;
grant execute on function public.metricas_painel(int) to service_role;
