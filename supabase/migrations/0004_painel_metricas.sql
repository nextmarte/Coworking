-- Migração 0004 — Métricas para o painel de acompanhamento (chefia)
-- Execute no SQL Editor do Supabase APÓS as migrações anteriores.
--
-- O que faz:
--   Cria a função metricas_painel(), que devolve, em UM único JSON, tudo que o
--   painel /relatorios precisa mostrar:
--     - total     : inscrições acumuladas (desde sempre)
--     - hoje       : inscrições feitas hoje (fuso de São Paulo)
--     - semana     : inscrições dos últimos 7 dias (inclui hoje)
--     - ultima     : data/hora da inscrição mais recente
--     - serie      : contagem por dia dos últimos p_dias dias (com dias vazios
--                    preenchidos com zero, para o gráfico de evolução)
--
--   A função só devolve NÚMEROS AGREGADOS — nenhum dado pessoal (nome, CPF,
--   e-mail, telefone) sai do banco. O acesso é restrito ao papel service_role
--   (usado apenas no servidor); anon e authenticated NÃO podem chamá-la.
--
-- É idempotente: pode ser reexecutado sem erro.

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
      created_at
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
    ), '[]'::jsonb)
  );
$$;

-- Trava o acesso: só o servidor (service_role) enxerga os números.
revoke all on function public.metricas_painel(int) from public, anon, authenticated;
grant execute on function public.metricas_painel(int) to service_role;
