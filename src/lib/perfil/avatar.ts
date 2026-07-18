// Avatar por iniciais quando o aluno não tem foto: letra(s) do nome num
// círculo de cor determinística pelo id. Lógica pura, usada no servidor.

export const CORES_AVATAR = [
  "bg-brand-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-violet-600",
  "bg-sky-600",
] as const;

export type CorAvatar = (typeof CORES_AVATAR)[number];

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  return partes
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function corDoAvatar(id: string): CorAvatar {
  let soma = 0;
  for (const char of id) soma = (soma + char.charCodeAt(0)) % 997;
  return CORES_AVATAR[soma % CORES_AVATAR.length];
}
