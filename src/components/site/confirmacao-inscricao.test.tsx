import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfirmacaoInscricao } from "./confirmacao-inscricao";

describe("ConfirmacaoInscricao", () => {
  it("mostra o aviso pra conferir a caixa de spam", () => {
    render(<ConfirmacaoInscricao />);
    expect(screen.getByText(/caixa de/i)).toBeInTheDocument();
    expect(screen.getAllByText(/spam/i).length).toBeGreaterThan(0);
  });
});
