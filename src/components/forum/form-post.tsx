"use client";

// Criação de post: dúvida ou enquete (opções dinâmicas), com disciplina
// opcional. O envio passa pela moderação — o redirect leva à página do post.

import { useActionState, useState } from "react";
import {
  criarPost,
  type ForumState,
} from "@/app/(plataforma)/(aluno)/forum/actions";
import { OPCOES_MAX } from "@/lib/forum/validar-post";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export type DisciplinaOpcao = { id: string; titulo: string };

export function FormPost({
  disciplinas,
  disciplinaInicial,
  aoMudarTitulo,
}: {
  disciplinas: DisciplinaOpcao[];
  disciplinaInicial?: string;
  /** Notifica o título digitado (debounce fica em quem ouve). */
  aoMudarTitulo?: (titulo: string) => void;
}) {
  const [state, action, pending] = useActionState<ForumState, FormData>(
    criarPost,
    undefined,
  );
  const [tipo, setTipo] = useState<"duvida" | "enquete">("duvida");
  const [opcoes, setOpcoes] = useState<string[]>(["", ""]);

  function mudarOpcao(indice: number, valor: string) {
    setOpcoes((atual) => atual.map((o, i) => (i === indice ? valor : o)));
  }

  return (
    <form action={action} className="space-y-4">
      <div className="inline-flex rounded-lg border border-slate-200 bg-superficie p-0.5 text-sm shadow-sm">
        {(
          [
            ["duvida", "Dúvida"],
            ["enquete", "Enquete"],
          ] as const
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setTipo(valor)}
            aria-pressed={tipo === valor}
            className={
              tipo === valor
                ? "rounded-md bg-brand-900 px-3 py-1 font-medium text-white dark:bg-brand-100 dark:text-brand-900"
                : "rounded-md px-3 py-1 text-slate-500 transition hover:text-brand-900 dark:hover:text-brand-100"
            }
          >
            {rotulo}
          </button>
        ))}
      </div>
      <input type="hidden" name="tipo" value={tipo} />

      <div>
        <label
          htmlFor="post-titulo"
          className="mb-1 block text-xs font-medium text-slate-500"
        >
          {tipo === "enquete" ? "Pergunta da enquete" : "Título da dúvida"}
        </label>
        <input
          id="post-titulo"
          name="titulo"
          type="text"
          required
          minLength={3}
          maxLength={200}
          onChange={(e) => aoMudarTitulo?.(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="post-disciplina"
          className="mb-1 block text-xs font-medium text-slate-500"
        >
          Disciplina (opcional)
        </label>
        <select
          id="post-disciplina"
          name="disciplinaId"
          defaultValue={disciplinaInicial ?? ""}
          className={inputClass}
        >
          <option value="">Área geral</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.titulo}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="post-corpo"
          className="mb-1 block text-xs font-medium text-slate-500"
        >
          {tipo === "enquete" ? "Contexto (opcional)" : "Descreva sua dúvida"}
        </label>
        <textarea
          id="post-corpo"
          name="corpo"
          rows={5}
          maxLength={5000}
          required={tipo === "duvida"}
          className={inputClass}
        />
      </div>

      {tipo === "enquete" ? (
        <fieldset className="space-y-2">
          <legend className="mb-1 text-xs font-medium text-slate-500">
            Opções da enquete (2 a {OPCOES_MAX})
          </legend>
          {opcoes.map((opcao, i) => (
            <input
              key={i}
              name="opcoes"
              type="text"
              value={opcao}
              maxLength={200}
              onChange={(e) => mudarOpcao(i, e.target.value)}
              placeholder={`Opção ${i + 1}`}
              className={inputClass}
            />
          ))}
          <div className="flex gap-2">
            {opcoes.length < OPCOES_MAX ? (
              <button
                type="button"
                onClick={() => setOpcoes((o) => [...o, ""])}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                + opção
              </button>
            ) : null}
            {opcoes.length > 2 ? (
              <button
                type="button"
                onClick={() => setOpcoes((o) => o.slice(0, -1))}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                − opção
              </button>
            ) : null}
          </div>
        </fieldset>
      ) : null}

      {state && "error" in state ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Publicando… (passa pela moderação)" : "Publicar"}
      </button>
      <p className="text-xs text-slate-400">
        Toda publicação passa pela moderação automática; se precisar de
        revisão humana, ela aparece como “em análise” até um moderador
        avaliar.
      </p>
    </form>
  );
}
