import type { Metadata } from "next";
import { BotaoVoltar } from "@/components/ui/botao-voltar";
import { exigirAluno } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NovaPublicacao } from "@/components/forum/nova-publicacao";

export const metadata: Metadata = { title: "Nova publicação — Fórum CSMG" };
export const dynamic = "force-dynamic";

export default async function NovoPostPage({
  searchParams,
}: {
  searchParams: Promise<{ disciplina?: string }>;
}) {
  await exigirAluno();
  const parametros = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: disciplinas } = await supabase
    .from("disciplinas")
    .select("id, titulo")
    .order("ordem", { ascending: true });

  return (
    <main className="animate-aparecer mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <BotaoVoltar href="/forum">Voltar ao fórum</BotaoVoltar>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-900 dark:text-brand-100">
        Nova publicação
      </h1>
      <div className="mt-6">
        <NovaPublicacao
          disciplinas={disciplinas ?? []}
          disciplinaInicial={parametros.disciplina}
        />
      </div>
    </main>
  );
}
