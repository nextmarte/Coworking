"use server";

import { redirect } from "next/navigation";
import {
  senhaConfere,
  abrirSessaoPainel,
  fecharSessaoPainel,
} from "@/lib/painel-auth";

export type PainelState = { error?: string } | undefined;

/** Valida a senha do painel e abre a sessão. */
export async function entrarPainel(
  _prev: PainelState,
  formData: FormData,
): Promise<PainelState> {
  const senha = String(formData.get("senha") ?? "");

  if (!senha || !senhaConfere(senha)) {
    return { error: "Senha incorreta." };
  }

  await abrirSessaoPainel();
  redirect("/relatorios");
}

/** Encerra a sessão do painel. */
export async function sairPainel() {
  await fecharSessaoPainel();
  redirect("/relatorios");
}
