// Validação pura do perfil do aluno — mensagens em pt-BR, null quando ok.

export const BIO_MAX = 300;
export const NOME_MIN = 2;
export const NOME_MAX = 120;
export const FOTO_MAX_BYTES = 2 * 1024 * 1024;

const FORMATOS_FOTO = ["image/jpeg", "image/png", "image/webp"];

export function validarNome(nome: string): string | null {
  const limpo = nome.trim();
  if (limpo.length < NOME_MIN || limpo.length > NOME_MAX) {
    return `O nome precisa ter entre ${NOME_MIN} e ${NOME_MAX} caracteres.`;
  }
  return null;
}

export function validarBio(bio: string): string | null {
  if (bio.trim().length > BIO_MAX) {
    return `A bio pode ter no máximo ${BIO_MAX} caracteres.`;
  }
  return null;
}

export function validarFoto(tipo: string, bytes: number): string | null {
  if (!FORMATOS_FOTO.includes(tipo)) {
    return "Formato não suportado — envie JPG, PNG ou WebP.";
  }
  if (bytes > FOTO_MAX_BYTES) {
    return "A foto pode ter no máximo 2 MB.";
  }
  return null;
}
