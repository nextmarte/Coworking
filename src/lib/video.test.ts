import { describe, expect, it } from "vitest";

import { classificarVideo, resolverVideoAoAtualizar } from "./video";

describe("classificarVideo", () => {
  it("reconhece links do YouTube", () => {
    expect(classificarVideo("https://youtu.be/abc12345678")).toEqual({
      provider: "youtube",
      uid: "https://youtu.be/abc12345678",
    });
  });

  it("reconhece UID do Cloudflare Stream (32 hex)", () => {
    const uid = "a".repeat(32);
    expect(classificarVideo(uid)).toEqual({ provider: "cloudflare", uid });
  });

  it("trata outra URL como embed genérico", () => {
    expect(classificarVideo("https://exemplo.com/v.mp4")).toEqual({
      provider: "url",
      uid: "https://exemplo.com/v.mp4",
    });
  });

  it("link vazio = sem vídeo", () => {
    expect(classificarVideo("  ")).toEqual({ provider: "youtube", uid: null });
  });
});

describe("resolverVideoAoAtualizar", () => {
  const hospedado = {
    provider: "r2",
    video_uid: "aulas/xyz/video.mp4",
  };

  it("link vazio NÃO apaga um vídeo hospedado na plataforma", () => {
    expect(resolverVideoAoAtualizar("", hospedado)).toEqual(hospedado);
    expect(resolverVideoAoAtualizar("   ", hospedado)).toEqual(hospedado);
  });

  it("link novo substitui o vídeo hospedado (troca intencional)", () => {
    expect(
      resolverVideoAoAtualizar("https://youtu.be/abc12345678", hospedado),
    ).toEqual({
      provider: "youtube",
      video_uid: "https://youtu.be/abc12345678",
    });
  });

  it("link vazio limpa o vídeo de aulas por link (youtube/url)", () => {
    expect(
      resolverVideoAoAtualizar("", {
        provider: "youtube",
        video_uid: "https://youtu.be/abc12345678",
      }),
    ).toEqual({ provider: "youtube", video_uid: null });
  });

  it("funciona sem estado atual (aula nova)", () => {
    expect(resolverVideoAoAtualizar("", undefined)).toEqual({
      provider: "youtube",
      video_uid: null,
    });
  });
});
