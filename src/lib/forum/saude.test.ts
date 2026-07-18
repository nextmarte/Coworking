import { describe, expect, it } from "vitest";

import { calcularSaudeForum } from "./saude";

const AGORA = new Date("2026-07-18T12:00:00Z");

function diasAtras(dias: number): string {
  return new Date(AGORA.getTime() - dias * 24 * 60 * 60 * 1000).toISOString();
}

describe("calcularSaudeForum", () => {
  it("conta publicações dos últimos 7 dias (posts + respostas)", () => {
    const saude = calcularSaudeForum({
      agora: AGORA,
      posts: [
        { id: "a", criadoEm: diasAtras(1), vereditoIa: "aprovado" },
        { id: "b", criadoEm: diasAtras(10), vereditoIa: "aprovado" },
      ],
      respostas: [
        { postId: "a", criadoEm: diasAtras(2), vereditoIa: "aprovado" },
      ],
    });
    expect(saude.publicacoes7d).toBe(2);
  });

  it("calcula a taxa de aprovação automática da IA", () => {
    const saude = calcularSaudeForum({
      agora: AGORA,
      posts: [
        { id: "a", criadoEm: diasAtras(1), vereditoIa: "aprovado" },
        { id: "b", criadoEm: diasAtras(1), vereditoIa: "suspeito" },
        { id: "c", criadoEm: diasAtras(1), vereditoIa: "erro" },
        { id: "d", criadoEm: diasAtras(1), vereditoIa: null },
      ],
      respostas: [
        { postId: "a", criadoEm: diasAtras(1), vereditoIa: "aprovado" },
      ],
    });
    // 2 aprovados de 4 com veredito (o null ainda não foi moderado).
    expect(saude.aprovacaoAutomaticaPct).toBe(50);
  });

  it("mede o tempo médio até a primeira resposta", () => {
    const saude = calcularSaudeForum({
      agora: AGORA,
      posts: [
        { id: "a", criadoEm: diasAtras(2), vereditoIa: "aprovado" },
        { id: "b", criadoEm: diasAtras(2), vereditoIa: "aprovado" },
      ],
      respostas: [
        // primeira resposta de "a" em 4h; a segunda não conta
        {
          postId: "a",
          criadoEm: new Date(
            new Date(diasAtras(2)).getTime() + 4 * 3600_000,
          ).toISOString(),
          vereditoIa: "aprovado",
        },
        {
          postId: "a",
          criadoEm: diasAtras(0),
          vereditoIa: "aprovado",
        },
        // "b" em 8h
        {
          postId: "b",
          criadoEm: new Date(
            new Date(diasAtras(2)).getTime() + 8 * 3600_000,
          ).toISOString(),
          vereditoIa: "aprovado",
        },
      ],
    });
    expect(saude.horasMediaPrimeiraResposta).toBe(6);
  });

  it("sem dados devolve nulos e zero", () => {
    const saude = calcularSaudeForum({ agora: AGORA, posts: [], respostas: [] });
    expect(saude.publicacoes7d).toBe(0);
    expect(saude.aprovacaoAutomaticaPct).toBe(null);
    expect(saude.horasMediaPrimeiraResposta).toBe(null);
  });
});
