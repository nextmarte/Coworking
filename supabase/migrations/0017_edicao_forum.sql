-- Migração 0017 — Edição de publicações do fórum
-- Execute no SQL Editor do Supabase APÓS a 0016.
--
-- O que faz: coluna editado_em em posts e respostas — quando preenchida, a
-- publicação exibe a tag "editado". A edição em si acontece via server
-- action (service_role) com re-moderação pela IA; nenhuma policy muda
-- (aluno continua sem update direto no banco).
--
-- É idempotente: pode ser reexecutada sem erro.

alter table public.forum_posts
  add column if not exists editado_em timestamptz;

alter table public.forum_respostas
  add column if not exists editado_em timestamptz;
