-- Migração 0002 — Plataforma de ensino (AVA)
-- Execute no SQL Editor do Supabase APÓS 0001_matricula.sql.
--
-- O que faz:
--   1. Marca quem foi selecionado e quando ativou a conta (tabela inscricoes).
--   2. Cria o schema do curso: modulos (mentorias), aulas (vídeo), materiais e quizzes.
--   3. Cria o rastreio de progresso do aluno (aulas assistidas e tentativas de quiz),
--      base para o cálculo dos 70% exigidos para o certificado (Edital, item 10).
--   4. Habilita RLS em tudo: conteúdo é legível só por alunos autenticados; cada
--      aluno só enxerga o próprio progresso; o gabarito do quiz nunca vai ao cliente.
--
-- É idempotente: pode ser reexecutado sem erro.

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Elegibilidade do aluno (sobre a tabela de inscrições já existente)
-- ───────────────────────────────────────────────────────────────────────────
alter table public.inscricoes
  add column if not exists selecionado boolean not null default false,
  add column if not exists ativado_em timestamptz;

comment on column public.inscricoes.selecionado is
  'true = aprovado na seleção e liberado para criar conta de acesso ao AVA';
comment on column public.inscricoes.ativado_em is
  'preenchido no primeiro acesso, quando o aluno define a senha e cria a conta';

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Conteúdo do curso
-- ───────────────────────────────────────────────────────────────────────────

-- Mentorias temáticas (10 + bônus). "ordem" controla a sequência no painel.
create table if not exists public.modulos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  descricao text,
  instrutor text,
  ordem int not null default 0,
  publicado boolean not null default false,
  created_at timestamptz not null default now()
);

-- Videoaula de cada módulo. Agnóstico de provedor: hoje Cloudflare Stream,
-- amanhã outro, sem refatorar o app — basta provider + video_uid.
create table if not exists public.aulas (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos (id) on delete cascade,
  titulo text not null,
  descricao text,
  provider text not null default 'cloudflare',
  video_uid text,
  duracao_seg int,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists aulas_modulo_idx on public.aulas (modulo_id, ordem);

-- Apostilas / e-books de consulta (link no Supabase Storage ou URL externa).
create table if not exists public.materiais (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos (id) on delete cascade,
  titulo text not null,
  tipo text not null default 'pdf',
  url text not null,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists materiais_modulo_idx on public.materiais (modulo_id, ordem);

-- Quiz avaliativo por módulo.
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos (id) on delete cascade,
  titulo text not null default 'Avaliação do módulo',
  nota_minima int not null default 70,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_perguntas (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  enunciado text not null,
  ordem int not null default 0
);

-- ATENÇÃO: a coluna "correta" é o gabarito e NÃO pode chegar ao navegador.
-- Por isso não damos SELECT desta tabela ao papel "authenticated"; o cliente
-- lê apenas a view quiz_alternativas_publicas (sem o gabarito), e a correção
-- acontece no servidor via função corrigir_quiz().
create table if not exists public.quiz_alternativas (
  id uuid primary key default gen_random_uuid(),
  pergunta_id uuid not null references public.quiz_perguntas (id) on delete cascade,
  texto text not null,
  correta boolean not null default false,
  ordem int not null default 0
);

create index if not exists quiz_perguntas_quiz_idx on public.quiz_perguntas (quiz_id, ordem);
create index if not exists quiz_alt_pergunta_idx on public.quiz_alternativas (pergunta_id, ordem);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Progresso do aluno
-- ───────────────────────────────────────────────────────────────────────────

-- Uma linha por aula assistida. aluno_id = usuário autenticado (auth.users).
create table if not exists public.progresso_aula (
  aluno_id uuid not null references auth.users (id) on delete cascade,
  aula_id uuid not null references public.aulas (id) on delete cascade,
  assistida_em timestamptz not null default now(),
  primary key (aluno_id, aula_id)
);

-- Tentativas de quiz. Inserção feita SOMENTE pela função corrigir_quiz().
create table if not exists public.quiz_tentativas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references auth.users (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  nota numeric(5, 2) not null,
  aprovado boolean not null,
  respostas jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists quiz_tentativas_aluno_idx
  on public.quiz_tentativas (aluno_id, quiz_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Row Level Security
-- ───────────────────────────────────────────────────────────────────────────
alter table public.modulos            enable row level security;
alter table public.aulas              enable row level security;
alter table public.materiais          enable row level security;
alter table public.quizzes            enable row level security;
alter table public.quiz_perguntas     enable row level security;
alter table public.quiz_alternativas  enable row level security;
alter table public.progresso_aula     enable row level security;
alter table public.quiz_tentativas    enable row level security;

-- Conteúdo publicado: legível por qualquer aluno autenticado.
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'modulos_leitura_aluno') then
    create policy "modulos_leitura_aluno" on public.modulos
      for select to authenticated using (publicado = true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'aulas_leitura_aluno') then
    create policy "aulas_leitura_aluno" on public.aulas
      for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'materiais_leitura_aluno') then
    create policy "materiais_leitura_aluno" on public.materiais
      for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'quizzes_leitura_aluno') then
    create policy "quizzes_leitura_aluno" on public.quizzes
      for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'quiz_perguntas_leitura_aluno') then
    create policy "quiz_perguntas_leitura_aluno" on public.quiz_perguntas
      for select to authenticated using (true);
  end if;
  -- quiz_alternativas: SEM policy de select para authenticated (gabarito protegido).

  -- Progresso: cada aluno só lê e grava o próprio.
  if not exists (select 1 from pg_policies where policyname = 'progresso_leitura_propria') then
    create policy "progresso_leitura_propria" on public.progresso_aula
      for select to authenticated using (auth.uid() = aluno_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'progresso_insercao_propria') then
    create policy "progresso_insercao_propria" on public.progresso_aula
      for insert to authenticated with check (auth.uid() = aluno_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'tentativas_leitura_propria') then
    create policy "tentativas_leitura_propria" on public.quiz_tentativas
      for select to authenticated using (auth.uid() = aluno_id);
  end if;
end $$;

-- View pública das alternativas (sem o gabarito). SECURITY INVOKER respeita o
-- RLS de quiz_perguntas; as colunas sensíveis simplesmente não são expostas.
create or replace view public.quiz_alternativas_publicas
  with (security_invoker = true) as
select id, pergunta_id, texto, ordem
from public.quiz_alternativas;

grant select on public.quiz_alternativas_publicas to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Correção do quiz no servidor (gabarito nunca sai do banco)
--    p_respostas: { "<pergunta_id>": "<alternativa_id>", ... }
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.corrigir_quiz(
  p_quiz_id uuid,
  p_respostas jsonb
)
returns table (nota numeric, aprovado boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_acertos int;
  v_nota numeric;
  v_minima int;
  v_aluno uuid := auth.uid();
begin
  if v_aluno is null then
    raise exception 'Aluno não autenticado';
  end if;

  select count(*) into v_total
  from public.quiz_perguntas where quiz_id = p_quiz_id;

  if v_total = 0 then
    raise exception 'Quiz sem perguntas';
  end if;

  -- Conta acertos: alternativa marcada como resposta é a correta da pergunta.
  select count(*) into v_acertos
  from public.quiz_perguntas q
  join public.quiz_alternativas a
    on a.pergunta_id = q.id and a.correta = true
  where q.quiz_id = p_quiz_id
    and (p_respostas ->> q.id::text) = a.id::text;

  v_nota := round((v_acertos::numeric / v_total) * 100, 2);

  select nota_minima into v_minima from public.quizzes where id = p_quiz_id;

  insert into public.quiz_tentativas (aluno_id, quiz_id, nota, aprovado, respostas)
  values (v_aluno, p_quiz_id, v_nota, v_nota >= coalesce(v_minima, 70), p_respostas);

  return query select v_nota, v_nota >= coalesce(v_minima, 70);
end;
$$;

grant execute on function public.corrigir_quiz(uuid, jsonb) to authenticated;
