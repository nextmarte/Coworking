import { describe, expect, it } from "vitest";

import { validarBio, validarFoto, validarNome } from "./validar-perfil";

describe("validarNome", () => {
  it("nome razoável passa", () => {
    expect(validarNome("Maria da Silva")).toBe(null);
  });

  it("curto demais ou gigante é rejeitado", () => {
    expect(validarNome("A")).toMatch(/nome/i);
    expect(validarNome("x".repeat(121))).toMatch(/nome/i);
  });
});

describe("validarBio", () => {
  it("bio vazia é permitida (campo opcional)", () => {
    expect(validarBio("")).toBe(null);
    expect(validarBio("   ")).toBe(null);
  });

  it("bio dentro do limite passa; longa demais não", () => {
    expect(validarBio("Estudante apaixonada por direitos humanos.")).toBe(null);
    expect(validarBio("x".repeat(301))).toMatch(/bio/i);
  });
});

describe("validarFoto", () => {
  it("aceita jpeg, png e webp até 2 MB", () => {
    expect(validarFoto("image/jpeg", 1024)).toBe(null);
    expect(validarFoto("image/png", 2 * 1024 * 1024)).toBe(null);
    expect(validarFoto("image/webp", 500)).toBe(null);
  });

  it("recusa outros formatos e arquivos grandes", () => {
    expect(validarFoto("image/gif", 1024)).toMatch(/formato/i);
    expect(validarFoto("application/pdf", 1024)).toMatch(/formato/i);
    expect(validarFoto("image/jpeg", 2 * 1024 * 1024 + 1)).toMatch(/2 MB/);
  });
});
