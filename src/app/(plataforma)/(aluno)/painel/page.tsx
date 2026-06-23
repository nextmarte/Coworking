import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Meu painel — CSMG",
};

type Modulo = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  instrutor: string | null;
  ordem: number;
};

export default async function PainelPage() {
  const supabase = await createSupabaseServerClient();
  const { data: modulos } = await supabase
    .from("modulos")
    .select("id, slug, titulo, descricao, instrutor, ordem")
    .order("ordem", { ascending: true })
    .returns<Modulo[]>();

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Minhas mentorias</h1>
      <p className="mt-1 text-sm text-slate-500">
        10 mentorias temáticas · 20 horas de formação. Conclua 70% do conteúdo
        para emitir seu certificado.
      </p>

      {modulos && modulos.length > 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {modulos.map((modulo, i) => (
            <li
              key={modulo.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="text-xs font-semibold text-brand-500">
                Mentoria {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-1 font-semibold text-brand-900">
                {modulo.titulo}
              </h2>
              {modulo.instrutor ? (
                <p className="mt-0.5 text-sm text-slate-500">
                  {modulo.instrutor}
                </p>
              ) : null}
              {modulo.descricao ? (
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                  {modulo.descricao}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            As mentorias estão sendo preparadas.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            O conteúdo em vídeo, os materiais e os quizzes aparecerão aqui assim
            que forem publicados.
          </p>
        </div>
      )}
    </div>
  );
}
