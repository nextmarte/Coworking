import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Retorna o usuário autenticado (ou null). Memoizado por render para evitar
 * múltiplas idas ao Supabase no mesmo ciclo de renderização.
 */
export const getAluno = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Garante login; caso contrário redireciona para /login. Use nas páginas do AVA. */
export async function exigirAluno() {
  const user = await getAluno();
  if (!user) redirect("/login");
  return user;
}
