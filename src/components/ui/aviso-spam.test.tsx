import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AvisoSpam } from "./aviso-spam";

describe("AvisoSpam", () => {
  it("orienta a procurar no spam citando o remetente", () => {
    render(<AvisoSpam titulo="Não achou o e-mail?" />);
    expect(screen.getByText("Não achou o e-mail?")).toBeInTheDocument();
    expect(screen.getAllByText(/spam/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/coworking social/i)).toBeInTheDocument();
    expect(screen.getByText(/não é spam/i)).toBeInTheDocument();
  });
});
