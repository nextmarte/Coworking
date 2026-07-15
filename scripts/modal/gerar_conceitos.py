# Gera conceitos visuais da identidade CSMG na Modal (FLUX.1-schnell, GPU L40S).
#
# Uso:
#   modal run scripts/modal/gerar_conceitos.py
#
# Os PNGs são referência de direção de arte (padrões, ilustrações, composições);
# os ativos finais do repositório são SVGs vetoriais desenhados à mão.
# Saída: $CONCEITOS_DIR (ou ./design-conceitos por padrão — fora do git).

import os
import pathlib

import modal

app = modal.App("csmg-conceitos")

MODELO = "black-forest-labs/FLUX.1-schnell"  # Apache-2.0, não exige token HF

imagem = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "torch==2.8.0",
        "diffusers==0.35.2",
        "transformers==4.56.2",
        "accelerate==1.10.1",
        "sentencepiece==0.2.1",
        "protobuf==6.32.1",
        "hf_transfer==0.1.9",
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1", "HF_HOME": "/cache/hf"})
)

# Volume persistente: o download do modelo (~24 GB) acontece uma vez só.
cache_hf = modal.Volume.from_name("csmg-hf-cache", create_if_missing=True)

# Paleta extraída do logo oficial (roda de pessoas): verde-mar, âmbar,
# vermelho e papel. Todos os prompts ancoram nela para coerência.
PALETA = "deep teal (#17605B), warm amber (#D98E1B), muted vermilion (#C93A2E), warm paper white (#FAF7F2)"

PROMPTS = [
    {
        "nome": "monograma",
        "n": 4,
        "w": 1024,
        "h": 1024,
        "prompt": (
            "minimal flat vector logo mark, four interlocking arcs forming an open circle, "
            f"symbol of community and cooperation, palette {PALETA}, "
            "sober civic branding, generous negative space, no text, centered on plain background"
        ),
    },
    {
        "nome": "padrao",
        "n": 4,
        "w": 1024,
        "h": 1024,
        "prompt": (
            "seamless subtle geometric background pattern, small thin-line arcs and circles, "
            f"very low contrast, palette {PALETA}, "
            "elegant minimal texture for an education platform, flat vector style"
        ),
    },
    {
        "nome": "hero",
        "n": 4,
        "w": 1344,
        "h": 768,
        "prompt": (
            "abstract flat illustration, people gathered in a circle collaborating seen from above, "
            f"bold geometric shapes, Brazilian modernist poster style, palette {PALETA}, "
            "clean, sober, education and social change, no text"
        ),
    },
    {
        "nome": "vazio-aprendizado",
        "n": 3,
        "w": 1024,
        "h": 1024,
        "prompt": (
            "small abstract flat spot illustration, open book with growing plant and small arcs, "
            f"geometric minimal style, palette {PALETA}, "
            "lots of empty space around the subject, education, no text"
        ),
    },
    {
        "nome": "og-banner",
        "n": 3,
        "w": 1344,
        "h": 704,
        "prompt": (
            "wide banner composition, abstract interlocking arcs and circles suggesting a community network, "
            f"palette {PALETA}, large calm empty area on the left for text, "
            "sober civic design, flat vector style, no text"
        ),
    },
]


@app.function(image=imagem, gpu="L40S", volumes={"/cache/hf": cache_hf}, timeout=1800)
def gerar(prompts: list) -> list:
    import io

    import torch
    from diffusers import FluxPipeline

    pipe = FluxPipeline.from_pretrained(MODELO, torch_dtype=torch.bfloat16)
    pipe.to("cuda")

    saida = []
    for p in prompts:
        for i in range(p["n"]):
            img = pipe(
                p["prompt"],
                width=p["w"],
                height=p["h"],
                num_inference_steps=4,
                guidance_scale=0.0,
                generator=torch.Generator("cuda").manual_seed(42 + i),
            ).images[0]
            buf = io.BytesIO()
            img.save(buf, "PNG")
            saida.append((f"{p['nome']}-{i + 1}.png", buf.getvalue()))
            print(f"gerado {p['nome']}-{i + 1}.png")
    return saida


@app.local_entrypoint()
def main():
    destino = pathlib.Path(os.environ.get("CONCEITOS_DIR", "./design-conceitos"))
    destino.mkdir(parents=True, exist_ok=True)
    for nome, dados in gerar.remote(PROMPTS):
        (destino / nome).write_bytes(dados)
        print(f"salvo {destino / nome}")
