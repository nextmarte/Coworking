import { describe, expect, it } from "vitest";

import { formatarTaxaConversao } from "./conversao";

describe("formatarTaxaConversao", () => {
  it("calcula a taxa inscrições/visitas em percentual", () => {
    expect(formatarTaxaConversao(200, 30)).toBe("15%");
    expect(formatarTaxaConversao(3, 1)).toBe("33,3%");
  });

  it("arredonda pra uma casa e tira o zero desnecessário", () => {
    expect(formatarTaxaConversao(1000, 125)).toBe("12,5%");
    expect(formatarTaxaConversao(100, 100)).toBe("100%");
  });

  it("devolve travessão sem visitas (não dá pra medir)", () => {
    expect(formatarTaxaConversao(0, 5)).toBe("—");
    expect(formatarTaxaConversao(undefined, 5)).toBe("—");
  });
});
