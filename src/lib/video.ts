// Classificação do vídeo da aula a partir do que o master informa.
// Lógica pura, compartilhada pelas actions do master.

export type VideoAula = { provider: string; video_uid: string | null };

/** Detecta o provedor de vídeo a partir do link (ou ID) colado pelo master. */
export function classificarVideo(link: string): {
  provider: string;
  uid: string | null;
} {
  const v = link.trim();
  if (!v) return { provider: "youtube", uid: null };
  // YouTube: link (watch/youtu.be/shorts/embed) — guarda o link inteiro; o
  // player extrai o ID de 11 caracteres na hora de montar o embed.
  if (/youtube\.com|youtu\.be/.test(v)) return { provider: "youtube", uid: v };
  // Cloudflare Stream: URL de embed/watch ou UID (32 caracteres hexadecimais).
  if (/cloudflarestream\.com|videodelivery\.net/.test(v)) {
    const m = v.match(/[0-9a-f]{32}/i);
    return { provider: "cloudflare", uid: m ? m[0] : v };
  }
  if (/^[0-9a-f]{32}$/i.test(v)) return { provider: "cloudflare", uid: v };
  // Outra URL http(s): tratada como embed genérico.
  if (/^https?:\/\//.test(v)) return { provider: "url", uid: v };
  // Sem esquema e curto: provável ID de vídeo do YouTube (11 caracteres).
  return { provider: "youtube", uid: v };
}

/**
 * Decide o vídeo ao salvar a edição de uma aula. Campo de link vazio NÃO
 * remove um vídeo hospedado na plataforma (r2) — o formulário de edição não
 * mostra a chave do R2 no campo, então "vazio" ali não significa "apagar".
 * Colar um link por cima substitui de propósito.
 */
export function resolverVideoAoAtualizar(
  link: string,
  atual: VideoAula | undefined,
): VideoAula {
  if (!link.trim() && atual?.provider === "r2" && atual.video_uid) {
    return { provider: atual.provider, video_uid: atual.video_uid };
  }
  const { provider, uid } = classificarVideo(link);
  return { provider, video_uid: uid };
}
