import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Proteção do painel de acompanhamento (/relatorios) por SENHA ÚNICA.
 *
 * Não há conta individual: quem tem a senha (o chefe) entra. A senha fica na
 * variável de ambiente PAINEL_SENHA — só no servidor, nunca prefixada com
 * NEXT_PUBLIC_, então nunca chega ao navegador.
 *
 * Ao acertar a senha, gravamos um cookie httpOnly com um TOKEN derivado da
 * senha (sha256). O token não é a senha e ninguém consegue forjá-lo sem
 * conhecer PAINEL_SENHA. Se a senha for trocada, os cookies antigos param de
 * valer automaticamente (o token muda).
 */

const COOKIE = "painel_sessao";
const MAX_AGE = 60 * 60 * 12; // 12 horas

function senhaConfigurada(): string {
  const senha = process.env.PAINEL_SENHA;
  if (!senha) {
    throw new Error(
      "PAINEL_SENHA não configurada. Defina a variável de ambiente para liberar o painel.",
    );
  }
  return senha;
}

/** Token estável derivado da senha; guardado no cookie. */
function tokenEsperado(): string {
  return createHash("sha256").update(senhaConfigurada()).digest("hex");
}

/** Comparação de tempo constante (evita ataque de timing). */
function comparaSeguro(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** true se a senha digitada bate com PAINEL_SENHA. */
export function senhaConfere(input: string): boolean {
  return comparaSeguro(input, senhaConfigurada());
}

/** Grava o cookie de sessão do painel. */
export async function abrirSessaoPainel(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, tokenEsperado(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Encerra a sessão do painel. */
export async function fecharSessaoPainel(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

/** true se a requisição atual tem uma sessão válida do painel. */
export async function painelAutenticado(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return false;
  try {
    return comparaSeguro(token, tokenEsperado());
  } catch {
    // PAINEL_SENHA ausente: trata como não autenticado.
    return false;
  }
}
