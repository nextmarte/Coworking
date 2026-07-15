import { describe, expect, it } from "vitest";

import { bloquearRotaNaLanding } from "./lancamento";

const env = {
  DOMINIO_LANDING: "coworkingsocial.com.br",
  PLATAFORMA_LIBERADA: "nao",
};

describe("bloquearRotaNaLanding", () => {
  it("bloqueia rotas da plataforma no domínio principal antes do lançamento", () => {
    for (const rota of [
      "/login",
      "/primeiro-acesso",
      "/painel",
      "/modulos/1/2",
      "/master",
      "/master/disciplinas",
    ]) {
      expect(
        bloquearRotaNaLanding("coworkingsocial.com.br", rota, env),
      ).toBe(true);
    }
  });

  it("bloqueia também com o prefixo www", () => {
    expect(
      bloquearRotaNaLanding("www.coworkingsocial.com.br", "/login", env),
    ).toBe(true);
  });

  it("não bloqueia no subdomínio de preview", () => {
    expect(
      bloquearRotaNaLanding("app.coworkingsocial.com.br", "/login", env),
    ).toBe(false);
    expect(
      bloquearRotaNaLanding("app.coworkingsocial.com.br", "/master", env),
    ).toBe(false);
  });

  it("nunca bloqueia landing, relatórios e API", () => {
    for (const rota of ["/", "/relatorios", "/api/ia/chat", "/api/video/concluir"]) {
      expect(
        bloquearRotaNaLanding("coworkingsocial.com.br", rota, env),
      ).toBe(false);
    }
  });

  it("não bloqueia nada depois do lançamento", () => {
    expect(
      bloquearRotaNaLanding("coworkingsocial.com.br", "/login", {
        ...env,
        PLATAFORMA_LIBERADA: "sim",
      }),
    ).toBe(false);
  });

  it("não bloqueia nada quando DOMINIO_LANDING não está configurado", () => {
    expect(
      bloquearRotaNaLanding("coworkingsocial.com.br", "/login", {}),
    ).toBe(false);
    expect(bloquearRotaNaLanding("localhost", "/login", {})).toBe(false);
  });

  it("não bloqueia hosts que não são o domínio principal (dev, IP)", () => {
    expect(bloquearRotaNaLanding("localhost", "/login", env)).toBe(false);
    expect(bloquearRotaNaLanding("147.79.107.52", "/login", env)).toBe(false);
  });
});
