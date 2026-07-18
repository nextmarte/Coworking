import type { Metadata } from "next";
import Link from "next/link";
import { exigirAluno } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormPost } from "@/components/forum/form-post";

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
    <main className="animate-aparecer mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <Link
        href="/forum"
        className="text-sm text-slate-500 transition hover:text-brand-900 dark:hover:text-brand-100"
      >
        ← Voltar ao fórum
      </Link>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-900 dark:text-brand-100">
        Nova publicação
      </h1>
      <div className="mt-6">
        <FormPost
          disciplinas={disciplinas ?? []}
          disciplinaInicial={parametros.disciplina}
        />
      </div>
    </main>
  );
}
