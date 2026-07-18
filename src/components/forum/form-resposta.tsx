"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  criarResposta,
  type ForumState,
} from "@/app/(plataforma)/(aluno)/forum/actions";

export function FormResposta({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState<ForumState, FormData>(
    criarResposta,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Sucesso (state undefined após envio) limpa o campo.
  useEffect(() => {
    if (state === undefined) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <textarea
        name="corpo"
        rows={3}
        required
        maxLength={5000}
        placeholder="Contribua com a discussão…"
        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />
      {state && "error" in state ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Enviando… (passa pela moderação)" : "Responder"}
      </button>
    </form>
  );
}
