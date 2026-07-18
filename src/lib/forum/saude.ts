// Saúde do fórum pro card dos relatórios: volume, quanto a IA resolve
// sozinha e a rapidez da comunidade. Lógica pura; as queries ficam no card.

export type PublicacaoSaude = {
  criadoEm: string;
  vereditoIa: "aprovado" | "suspeito" | "erro" | null;
};

export type SaudeForum = {
  /** Posts + respostas criados nos últimos 7 dias. */
  publicacoes7d: number;
  /** % das publicações moderadas que a IA aprovou sozinha (null sem dados). */
  aprovacaoAutomaticaPct: number | null;
  /** Média de horas entre o post e a primeira resposta (null sem pares). */
  horasMediaPrimeiraResposta: number | null;
};

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

export function calcularSaudeForum(entrada: {
  agora: Date;
  posts: (PublicacaoSaude & { id: string })[];
  respostas: (PublicacaoSaude & { postId: string })[];
}): SaudeForum {
  const corte = entrada.agora.getTime() - SETE_DIAS_MS;
  const todas: PublicacaoSaude[] = [...entrada.posts, ...entrada.respostas];

  const publicacoes7d = todas.filter(
    (p) => new Date(p.criadoEm).getTime() >= corte,
  ).length;

  const moderadas = todas.filter((p) => p.vereditoIa !== null);
  const aprovadas = moderadas.filter((p) => p.vereditoIa === "aprovado");
  const aprovacaoAutomaticaPct =
    moderadas.length > 0
      ? Math.round((aprovadas.length / moderadas.length) * 100)
      : null;

  const primeiraResposta = new Map<string, number>();
  for (const r of entrada.respostas) {
    const quando = new Date(r.criadoEm).getTime();
    const atual = primeiraResposta.get(r.postId);
    if (atual === undefined || quando < atual) {
      primeiraResposta.set(r.postId, quando);
    }
  }
  const esperas: number[] = [];
  for (const post of entrada.posts) {
    const resposta = primeiraResposta.get(post.id);
    if (resposta !== undefined) {
      esperas.push((resposta - new Date(post.criadoEm).getTime()) / 3600_000);
    }
  }
  const horasMediaPrimeiraResposta =
    esperas.length > 0
      ? Math.round(
          (esperas.reduce((soma, h) => soma + h, 0) / esperas.length) * 10,
        ) / 10
      : null;

  return { publicacoes7d, aprovacaoAutomaticaPct, horasMediaPrimeiraResposta };
}
