# Plataforma de Educação — CSMG

Ambiente Virtual de Aprendizagem (AVA) do **Coworking Social de Mudanças
Globais (CSMG)**. Duas áreas no mesmo projeto Next.js, que sobem juntas para a
Vercel mas são isoladas por _route groups_:

- **`(site)`** — inscrição pública (nome, CPF, e-mail, telefone) com matrícula
  única por aluno. Rota `/`.
- **`(plataforma)`** — área autenticada do aluno (login por e-mail + senha,
  primeiro acesso, painel de mentorias). Rotas `/login`, `/primeiro-acesso`,
  `/painel`. Protegida pelo `src/proxy.ts`.

## Stack

- **Next.js 16** (App Router, TypeScript, `proxy.ts`)
- **Tailwind CSS 4**
- **Supabase** (Postgres + Auth via `@supabase/ssr`)
- **Cloudflare Stream** (vídeo das aulas — a integrar)
- Deploy: Vercel (via GitHub)

## Rodando localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.local.example .env.local
# edite .env.local com URL, anon key e service_role key do Supabase

# 3. Aplicar o schema no Supabase (SQL Editor, em ordem)
#   schema.sql                       → tabela inscricoes + RLS
#   migrations/0001_matricula.sql    → matrícula do aluno
#   migrations/0002_plataforma_ensino.sql → elegibilidade + módulos/aulas/quizzes + RLS

# 4. Rodar dev server
npm run dev
```

Acesse http://localhost:3000.

## Variáveis de ambiente

| Variável | Onde | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | cliente + servidor | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente + servidor | chave pública (respeita RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **só servidor** | cria a conta do aluno no 1º acesso — nunca expor ao cliente nem prefixar com `NEXT_PUBLIC_` |

Configure as três também na Vercel (Project Settings → Environment Variables).

## Estrutura

```
src/
├── app/
│   ├── actions.ts                    # Server Action da inscrição
│   ├── globals.css                   # paleta brand (azul escuro)
│   ├── layout.tsx                    # shell raiz (html/body)
│   ├── (site)/
│   │   └── page.tsx                  # landing + formulário de inscrição
│   └── (plataforma)/
│       ├── actions.ts                # login / primeiroAcesso / logout
│       ├── login/page.tsx
│       ├── primeiro-acesso/page.tsx
│       └── (aluno)/                  # rotas que exigem login
│           ├── layout.tsx            # header autenticado + sair
│           └── painel/page.tsx       # lista de mentorias
├── components/
│   ├── registration-form.tsx
│   └── auth/                         # auth-shell, login-form, primeiro-acesso-form
├── lib/
│   ├── cpf.ts · phone.ts
│   ├── supabase.ts                   # cliente lazy (inscrição)
│   ├── supabase/                     # server.ts · client.ts · admin.ts (SSR)
│   └── auth.ts                       # DAL: getAluno / exigirAluno
└── proxy.ts                          # renova sessão + protege a área do aluno

supabase/
├── schema.sql
└── migrations/
    ├── 0001_matricula.sql
    └── 0002_plataforma_ensino.sql    # módulos, aulas, materiais, quizzes, progresso
```

## Como o aluno entra

1. A coordenação marca `selecionado = true` na linha do aluno em `inscricoes`.
2. O aluno acessa `/primeiro-acesso`, informa **matrícula + e-mail** e cria a
   senha. O servidor valida a elegibilidade com a `service_role`, cria a conta
   no Supabase Auth e registra `ativado_em`.
3. Acessos seguintes: `/login` com e-mail + senha.

## Próximos passos

- [ ] Adicionar `SUPABASE_SERVICE_ROLE_KEY` ao `.env.local` e à Vercel
- [ ] Executar a migração `0002_plataforma_ensino.sql` no Supabase
- [ ] Marcar alunos selecionados (`update inscricoes set selecionado = true ...`)
- [ ] Integrar player Cloudflare Stream na página da mentoria (`/mentorias/[slug]`)
- [ ] Telas de quiz (correção via `corrigir_quiz`) e materiais
- [ ] Cálculo dos 70% + emissão de certificado
- [ ] Painel administrativo de conteúdo e seleção
```
