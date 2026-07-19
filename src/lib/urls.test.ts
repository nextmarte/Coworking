import { describe, expect, it } from "vitest";
import { urlDaPlataforma } from "./urls";

describe("urlDaPlataforma", () => {
  it("usa o subdomínio app do domínio principal em produção", () => {
    expect(
      urlDaPlataforma({
        DOMINIO_LANDING: "coworkingsocial.com.br",
        NEXT_PUBLIC_SITE_URL: "https://coworkingsocial.com.br",
      }),
    ).toBe("https://app.coworkingsocial.com.br");
  });

  it("cai pro SITE_URL quando não há domínio configurado (preview)", () => {
    expect(
      urlDaPlataforma({ NEXT_PUBLIC_SITE_URL: "https://x.vercel.app" }),
    ).toBe("https://x.vercel.app");
  });

  it("cai pro localhost em dev sem nada configurado", () => {
    expect(urlDaPlataforma({})).toBe("http://localhost:3000");
  });
});
