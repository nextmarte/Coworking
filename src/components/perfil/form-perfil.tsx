"use client";

import { useActionState } from "react";
import {
  enviarFoto,
  salvarPerfil,
  type PerfilState,
} from "@/app/(plataforma)/(aluno)/perfil/actions";
import { BIO_MAX } from "@/lib/perfil/validar-perfil";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

function Mensagem({ state }: { state: PerfilState }) {
  if (!state) return null;
  return "error" in state ? (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {state.error}
    </p>
  ) : (
    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      {state.ok}
    </p>
  );
}

export function FormPerfil({
  nome,
  bio,
}: {
  nome: string;
  bio: string;
}) {
  const [state, action, pending] = useActionState<PerfilState, FormData>(
    salvarPerfil,
    undefined,
  );

  return (
    <form action={action} className="space-y-3">
      <div>
        <label
          htmlFor="perfil-nome"
          className="mb-1 block text-xs font-medium text-slate-500"
        >
          Nome de exibição
        </label>
        <input
          id="perfil-nome"
          name="nome"
          type="text"
          required
          defaultValue={nome}
          maxLength={120}
          className={inputClass}
        />
      </div>
      <div>
        <label
          htmlFor="perfil-bio"
          className="mb-1 block text-xs font-medium text-slate-500"
        >
          Bio (opcional — aparece pro resto da turma)
        </label>
        <textarea
          id="perfil-bio"
          name="bio"
          rows={3}
          maxLength={BIO_MAX}
          defaultValue={bio}
          placeholder="Conte pra turma quem você é: interesses, cidade, o que veio buscar…"
          className={inputClass}
        />
      </div>
      <Mensagem state={state} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar perfil"}
      </button>
    </form>
  );
}

export function FormFoto() {
  const [state, action, pending] = useActionState<PerfilState, FormData>(
    enviarFoto,
    undefined,
  );

  return (
    <form action={action} className="space-y-2">
      <label
        htmlFor="perfil-foto"
        className="mb-1 block text-xs font-medium text-slate-500"
      >
        Foto de perfil (JPG, PNG ou WebP, até 2 MB)
      </label>
      <input
        id="perfil-foto"
        name="foto"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
        className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-700"
      />
      <Mensagem state={state} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Atualizar foto"}
      </button>
    </form>
  );
}
