import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Cliente administrativo (service_role). NUNCA importe isto em código de
 * cliente: a chave ignora o RLS e tem poderes totais sobre o banco.
 * Uso exclusivo em Server Actions/Route Handlers — ex.: criar a conta de
 * acesso do aluno no primeiro acesso.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias para operações administrativas.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
