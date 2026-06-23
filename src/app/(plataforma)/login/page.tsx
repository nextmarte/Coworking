import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar — CSMG",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <AuthShell
      titulo="Entrar"
      subtitulo="Acesse o ambiente de estudos da 1ª Turma Online."
      rodape={
        <>
          Primeiro acesso?{" "}
          <Link href="/primeiro-acesso" className="font-semibold text-white underline">
            Ative sua conta
          </Link>
        </>
      }
    >
      <LoginForm redirectTo={redirect} />
    </AuthShell>
  );
}
