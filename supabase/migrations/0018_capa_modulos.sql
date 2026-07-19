-- Migração 0018 — Capa dos módulos
-- Execute no SQL Editor do Supabase APÓS a 0017.
--
-- O que faz: coluna capa_url em modulos — URL pública da imagem de capa
-- (bucket "materiais", prefixo capas/). O upload acontece na área do master;
-- o painel do aluno mostra a capa como thumbnail na lista de módulos.
--
-- É idempotente: pode ser reexecutada sem erro.

alter table public.modulos
  add column if not exists capa_url text;
