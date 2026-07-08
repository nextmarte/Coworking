-- Migração 0007 — Corrige a exibição das alternativas do quiz para o aluno
-- Execute no SQL Editor do Supabase APÓS as migrações anteriores. Idempotente.
--
-- PROBLEMA:
--   A view public.quiz_alternativas_publicas foi criada (0002) com
--   security_invoker = true. Como a tabela public.quiz_alternativas tem RLS
--   ativo e NÃO tem policy de SELECT para `authenticated` (proposital, para o
--   gabarito nunca vazar), a view rodava com as permissões do aluno e era
--   barrada — retornando ZERO linhas. Resultado: o aluno via as perguntas mas
--   nenhuma alternativa.
--
-- CORREÇÃO:
--   A view passa a rodar como DEFINER (security_invoker = false). A dona da view
--   (postgres) ignora o RLS da tabela base e devolve as linhas — mas a view
--   expõe apenas id, pergunta_id, texto e ordem. A coluna `correta` (gabarito)
--   continua fora da view e a tabela segue sem SELECT para `authenticated`,
--   então o gabarito permanece protegido. A correção do quiz continua no
--   servidor via corrigir_quiz().

create or replace view public.quiz_alternativas_publicas
  with (security_invoker = false) as
select id, pergunta_id, texto, ordem
from public.quiz_alternativas;

grant select on public.quiz_alternativas_publicas to authenticated;
