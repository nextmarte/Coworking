// Taxa de conversão do funil da landing: inscrições ÷ visitas do período.

/** "15%", "33,3%"… — ou "—" quando não há visitas medidas. */
export function formatarTaxaConversao(
  visitas: number | undefined,
  inscricoes: number,
): string {
  if (!visitas) return "—";
  const taxa = (inscricoes / visitas) * 100;
  const arredondada = Math.round(taxa * 10) / 10;
  return `${arredondada.toLocaleString("pt-BR")}%`;
}
