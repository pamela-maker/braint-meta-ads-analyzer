import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `Eres un experto en performance marketing especializado en Meta Ads bajo la lógica del algoritmo Andromeda.

Evalua el anuncio publicitario segun estos 8 criterios (0-10 cada uno):
1. Fuerza del hook
2. Claridad del mensaje
3. Densidad de senal
4. Angulo de conversion — Identifica tipo y evalua efectividad.
5. Friccion cognitiva — 10=baja friccion, 0=alta.
6. Potencial de iteracion
7. Optimizacion de extension
8. Estructura y diseno

Si hay imagen evalua tambien: composicion, contraste, legibilidad, coherencia copy-visual.

RESPONDE en este formato exacto:

SCORE_GENERAL: [numero]/10

CRITERIOS:
1. Fuerza del hook: [X]/10 — [1 linea]
2. Claridad del mensaje: [X]/10 — [1 linea]
3. Densidad de senal: [X]/10 — [1 linea]
4. Angulo de conversion ([tipo]): [X]/10 — [1 linea]
5. Friccion cognitiva: [X]/10 — [1 linea]
6. Potencial de iteracion: [X]/10 — [1 linea]
7. Optimizacion de extension: [X]/10 — [1 linea]
8. Estructura y diseno: [X]/10 — [1 linea]

ANALISIS_VISUAL:
[Si hay imagen: 2-3 lineas. Si no hay imagen, escribe "N/A"]

RECOMENDACIONES:
1. [accionable concreta]
2. [accionable concreta]
3. [accionable concreta]

VERSION_OPTIMIZADA:
[copy del anuncio reescrito y mejorado]

Score ponderado: hook x1.5, claridad x1.3, angulo conversion x1.2.`;

export async function POST(request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
    }
    const { adText, image } = await request.json();
    if (!adText?.trim() && !image) {
      return NextResponse.json({ error: "Envia al menos el copy o una imagen" }, { status: 400 });
    }
    const content = [];
    if (image) {
      content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.base64 } });
    }
    let prompt = "Evalua este anuncio de Meta Ads:";
    if (image && adText?.trim()) {
      prompt += "\n\nIMAGEN adjunta del creativo.\n\nCOPY:\n" + adText;
    } else if (image) {
      prompt += "\n\nIMAGEN adjunta. Evalua todo lo visible (texto, composicion, diseno).";
    } else {
      prompt += "\n\n" + adText;
    }
    content.push({ type: "text", text: prompt });
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: SYSTEM_PROMPT, messages: [{ role: "user", content }] })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      return NextResponse.json({ error: errData?.error?.message || "Error API: " + response.status }, { status: response.status });
    }
    const data = await response.json();
    const text = data.content?.map((b) => b.text || "").join("\n") || "";
    return NextResponse.json({ result: text });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}
