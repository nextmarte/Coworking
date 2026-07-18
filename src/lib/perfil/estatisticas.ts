import "server-only";

// Números do perfil público: participação no fórum e progresso no curso.
// Agregados via service_role (votos e progresso têm RLS restrito ao dono).

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type EstatisticasPerfil = {
  posts: number;
  respostas: number;
  uteisRecebidos: number;
  solucoes: number;
  aulasConcluidas: number;
  totalAulas: number;
  avaliacoesAprovadas: number;
};

export async function estatisticasDoAluno(
  alunoId: string,
): Promise<EstatisticasPerfil> {
  const admin = createSupabaseAdminClient();

  const [posts, respostas, progresso, aulas, tentativas] = await Promise.all([
    admin
      .from("forum_posts")
      .select("id", { count: "exact" })
      .eq("autor_id", alunoId)
      .eq("status", "aprovado"),
    admin
      .from("forum_respostas")
      .select("id", { count: "exact" })
      .eq("autor_id", alunoId)
      .eq("status", "aprovado"),
    admin
      .from("progresso_aula")
      .select("aula_id", { count: "exact", head: true })
      .eq("aluno_id", alunoId),
    admin.from("aulas").select("id", { count: "exact", head: true }),
    admin
      .from("quiz_tentativas")
      .select("quiz_id")
      .eq("aluno_id", alunoId)
      .eq("aprovado", true),
  ]);

  const postIds = (posts.data ?? []).map((p) => p.id as string);
  const respostaIds = (respostas.data ?? []).map((r) => r.id as string);

  const [votosPosts, votosRespostas, solucoes] = await Promise.all([
    postIds.length > 0
      ? admin
          .from("forum_votos_posts")
          .select("post_id", { count: "exact", head: true })
          .in("post_id", postIds)
      : Promise.resolve({ count: 0 }),
    respostaIds.length > 0
      ? admin
          .from("forum_votos_respostas")
          .select("resposta_id", { count: "exact", head: true })
          .in("resposta_id", respostaIds)
      : Promise.resolve({ count: 0 }),
    respostaIds.length > 0
      ? admin
          .from("forum_posts")
          .select("id", { count: "exact", head: true })
          .in("resposta_solucao_id", respostaIds)
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    posts: posts.count ?? 0,
    respostas: respostas.count ?? 0,
    uteisRecebidos: (votosPosts.count ?? 0) + (votosRespostas.count ?? 0),
    solucoes: solucoes.count ?? 0,
    aulasConcluidas: progresso.count ?? 0,
    totalAulas: aulas.count ?? 0,
    avaliacoesAprovadas: new Set(
      (tentativas.data ?? []).map((t) => t.quiz_id as string),
    ).size,
  };
}
