-- Migração 0016 — Perfil do aluno (bio + foto)
-- Execute no SQL Editor do Supabase APÓS a 0015.
--
-- O que faz:
--   1. Tabela perfis: bio curta e URL da foto, uma linha por aluno.
--      Leitura pra qualquer aluno logado (o perfil é público na turma —
--      clicar num nome no fórum abre o perfil); escrita só do próprio.
--   2. Bucket público `avatares` no Storage: as fotos são servidas direto
--      pela URL pública; o upload passa pelo servidor (service_role), que
--      valida formato e tamanho.
--
-- Sem esta migração o site segue normal, só sem a página de perfil.
-- É idempotente: pode ser reexecutada sem erro.

create table if not exists public.perfis (
  aluno_id uuid primary key references auth.users (id) on delete cascade,
  bio text check (bio is null or char_length(bio) <= 300),
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table public.perfis enable row level security;

drop policy if exists perfis_select on public.perfis;
create policy perfis_select on public.perfis
  for select to authenticated
  using (true);

drop policy if exists perfis_insert on public.perfis;
create policy perfis_insert on public.perfis
  for insert to authenticated
  with check (aluno_id = auth.uid());

drop policy if exists perfis_update on public.perfis;
create policy perfis_update on public.perfis
  for update to authenticated
  using (aluno_id = auth.uid())
  with check (aluno_id = auth.uid());

-- Bucket público das fotos de perfil (upload só pelo servidor/service_role;
-- nenhuma policy de escrita em storage.objects pra authenticated).
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;
