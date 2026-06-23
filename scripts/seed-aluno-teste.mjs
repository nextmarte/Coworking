// Cria (ou reseta) um aluno de teste para experimentar o fluxo de acesso ao AVA.
// Uso: node scripts/seed-aluno-teste.mjs <email> ["Nome do Aluno"]
//
// O que faz, de forma idempotente (pode rodar de novo sem erro):
//   1. Garante uma inscrição com esse e-mail, marcada como selecionado = true
//      e ativado_em = null (libera o primeiro acesso).
//   2. Remove qualquer conta de auth pré-existente com esse e-mail, para que o
//      /primeiro-acesso possa criar a senha do zero.
//   3. Imprime a matrícula a usar no primeiro acesso.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Carrega variáveis do .env.local (node não faz isso sozinho).
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const email = (process.argv[2] ?? "").trim().toLowerCase();
const nome = process.argv[3] ?? "Aluno de Teste";
if (!email) {
  console.error('Informe o e-mail: node scripts/seed-aluno-teste.mjs <email> ["Nome"]');
  process.exit(1);
}

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// 1. Inscrição: cria ou reseta para liberar o primeiro acesso.
let { data: inscricao } = await admin
  .from("inscricoes")
  .select("id, matricula")
  .eq("email", email)
  .maybeSingle();

if (inscricao) {
  await admin
    .from("inscricoes")
    .update({ selecionado: true, ativado_em: null })
    .eq("id", inscricao.id);
} else {
  // CPF/telefone fictícios apenas para satisfazer as colunas NOT NULL/unique.
  const cpf = String(Date.now()).slice(-11).padStart(11, "0");
  const { data, error } = await admin
    .from("inscricoes")
    .insert({ nome, cpf, email, telefone: "21999999999", selecionado: true })
    .select("id, matricula")
    .single();
  if (error) {
    console.error("Erro ao inserir inscrição:", error.message);
    process.exit(1);
  }
  inscricao = data;
}

// 2. Remove conta de auth anterior (se houver) para reativar do zero.
const { data: lista } = await admin.auth.admin.listUsers({ perPage: 1000 });
const existente = lista?.users?.find((u) => u.email?.toLowerCase() === email);
if (existente) {
  await admin.auth.admin.deleteUser(existente.id);
}

console.log("\n✅ Aluno de teste pronto!\n");
console.log("   E-mail:    ", email);
console.log("   Matrícula: ", inscricao.matricula);
console.log("\nAgora acesse http://localhost:3000/primeiro-acesso e use a matrícula");
console.log("e o e-mail acima para criar sua senha.\n");
