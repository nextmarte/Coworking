"use server";

// Actions do perfil do aluno: dados e bio (com moderação de políticas) e
// upload da foto pro bucket público de avatares.

import { revalidatePath } from "next/cache";
import { exigirAluno } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { moderarBio } from "@/lib/forum/moderacao";
import {
  validarBio,
  validarFoto,
  validarNome,
} from "@/lib/perfil/validar-perfil";

export type PerfilState = { ok: string } | { error: string } | undefined;

export async function salvarPerfil(
  _prev: PerfilState,
  formData: FormData,
): Promise<PerfilState> {
  const aluno = await exigirAluno();
  const nome = String(formData.get("nome") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  const nomeInvalido = validarNome(nome);
  if (nomeInvalido) return { error: nomeInvalido };
  const bioInvalida = validarBio(bio);
  if (bioInvalida) return { error: bioInvalida };

  // Bio passa pela moderação de políticas (bio pessoal é bem-vinda; ofensa/
  // spam não entram). IA fora do ar não trava a edição do perfil — a
  // exposição é pequena e a equipe pode intervir depois.
  if (bio) {
    const veredito = await moderarBio(bio);
    if (veredito.veredito === "suspeito") {
      return {
        error: `A bio não foi aprovada pela moderação: ${veredito.motivo}`,
      };
    }
  }

  const supabase = await createSupabaseServerClient();
  const { error: erroNome } = await supabase.auth.updateUser({
    data: { nome },
  });
  if (erroNome) return { error: "Não foi possível salvar o nome." };

  const { error } = await supabase.from("perfis").upsert({
    aluno_id: aluno.id,
    bio: bio || null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "Não foi possível salvar o perfil." };

  revalidatePath("/perfil");
  revalidatePath(`/perfil/${aluno.id}`);
  return { ok: "Perfil salvo." };
}

export async function enviarFoto(
  _prev: PerfilState,
  formData: FormData,
): Promise<PerfilState> {
  const aluno = await exigirAluno();
  const foto = formData.get("foto");
  if (!(foto instanceof File) || foto.size === 0) {
    return { error: "Escolha uma imagem." };
  }
  const invalida = validarFoto(foto.type, foto.size);
  if (invalida) return { error: invalida };

  // Upload via service_role (o bucket não tem policy de escrita pública);
  // caminho fixo por aluno + cache-bust na URL — sem arquivos órfãos.
  const admin = createSupabaseAdminClient();
  const extensao = foto.type === "image/png" ? "png" : foto.type === "image/webp" ? "webp" : "jpg";
  const caminho = `${aluno.id}.${extensao}`;
  const { error: erroUpload } = await admin.storage
    .from("avatares")
    .upload(caminho, Buffer.from(await foto.arrayBuffer()), {
      contentType: foto.type,
      upsert: true,
    });
  if (erroUpload) return { error: "Não foi possível enviar a foto." };

  const { data: publica } = admin.storage
    .from("avatares")
    .getPublicUrl(caminho);
  const url = `${publica.publicUrl}?v=${Date.now()}`;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("perfis").upsert({
    aluno_id: aluno.id,
    avatar_url: url,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "Não foi possível salvar a foto no perfil." };

  revalidatePath("/perfil");
  revalidatePath(`/perfil/${aluno.id}`);
  revalidatePath("/forum");
  return { ok: "Foto atualizada." };
}
