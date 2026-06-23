import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { PrimeiroAcessoForm } from "@/components/auth/primeiro-acesso-form";

export const metadata: Metadata = {
  title: "Primeiro acesso — CSMG",
};

export default function PrimeiroAcessoPage() {
  return (
    <AuthShell
      titulo="Ativar meu acesso"
      subtitulo="Selecionado para a 1ª Turma? Crie sua senha para começar a estudar."
      rodape={
        <>
          Já ativou sua conta?{" "}
          <Link href="/login" className="font-semibold text-white underline">
            Entrar
          </Link>
        </>
      }
    >
      <PrimeiroAcessoForm />
    </AuthShell>
  );
}
