import { describe, expect, it } from "vitest";

import { CORES_AVATAR, corDoAvatar, iniciais } from "./avatar";

describe("iniciais", () => {
  it("pega a primeira letra dos dois primeiros nomes", () => {
    expect(iniciais("Maria da Silva")).toBe("MD");
    expect(iniciais("João Pedro")).toBe("JP");
  });

  it("nome único usa uma letra só", () => {
    expect(iniciais("Amanda")).toBe("A");
  });

  it("normaliza caixa e espaços; vazio vira interrogação", () => {
    expect(iniciais("  ana   beatriz  ")).toBe("AB");
    expect(iniciais("")).toBe("?");
    expect(iniciais("   ")).toBe("?");
  });
});

describe("corDoAvatar", () => {
  it("é determinística pro mesmo id", () => {
    expect(corDoAvatar("abc-123")).toBe(corDoAvatar("abc-123"));
  });

  it("devolve sempre uma das cores da paleta", () => {
    for (const id of ["a", "b", "c", "xyz-999", ""]) {
      expect(CORES_AVATAR).toContain(corDoAvatar(id));
    }
  });

  it("ids diferentes podem variar a cor (distribui pela paleta)", () => {
    const cores = new Set(
      Array.from({ length: 30 }, (_, i) => corDoAvatar(`aluno-${i}`)),
    );
    expect(cores.size).toBeGreaterThan(1);
  });
});
