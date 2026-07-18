// Card de saúde do fórum na aba Relatórios da administração. Some sozinho
// enquanto a migração 0015 não existir (as queries falham sem a tabela).

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  calcularSaudeForum,
  type SaudeForum,
} from "@/lib/forum/saude";

function Medida({
  rotulo,
  valor,
}: {
  rotulo: string;
  valor: string;
}) {
  return (
    <div>
      <p className="font-display text-2xl font-bold text-brand-900 dark:text-brand-100">
        {valor}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{rotulo}</p>
    </div>
  );
}

export async function CardSaudeForum() {
  const admin = createSupabaseAdminClient();
  const [posts, respostas] = await Promise.all([
    admin.from("forum_posts").select("id, created_at, veredito_ia"),
    admin.from("forum_respostas").select("post_id, created_at, veredito_ia"),
  ]);
  // Sem a migração 0015 (ou sem dado nenhum) o card não aparece.
  if (posts.error || respostas.error) return null;

  const saude: SaudeForum = calcularSaudeForum({
    agora: new Date(),
    posts: (posts.data ?? []).map((p) => ({
      id: p.id as string,
      criadoEm: p.created_at as string,
      vereditoIa: p.veredito_ia as "aprovado" | "suspeito" | "erro" | null,
    })),
    respostas: (respostas.data ?? []).map((r) => ({
      postId: r.post_id as string,
      criadoEm: r.created_at as string,
      vereditoIa: r.veredito_ia as "aprovado" | "suspeito" | "erro" | null,
    })),
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-superficie p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-brand-900 dark:text-brand-100">
        Saúde do fórum
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Medida
          rotulo="Publicações nos últimos 7 dias"
          valor={String(saude.publicacoes7d)}
        />
        <Medida
          rotulo="Aprovação automática da IA"
          valor={
            saude.aprovacaoAutomaticaPct === null
              ? "—"
              : `${saude.aprovacaoAutomaticaPct}%`
          }
        />
        <Medida
          rotulo="Horas até a primeira resposta (média)"
          valor={
            saude.horasMediaPrimeiraResposta === null
              ? "—"
              : saude.horasMediaPrimeiraResposta.toLocaleString("pt-BR")
          }
        />
      </div>
    </section>
  );
}
