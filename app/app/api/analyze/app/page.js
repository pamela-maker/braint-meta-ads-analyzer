"use client";
import { useState, useRef, useEffect } from "react";

function parseResponse(text) {
  const scoreMatch = text.match(/SCORE_GENERAL:\s*([\d.]+)\/10/);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
  const criteriosMatch = text.match(/CRITERIOS:\n([\s\S]*?)(?=\n(?:ANALISIS_VISUAL|RECOMENDACIONES):)/);
  const criterios = criteriosMatch ? criteriosMatch[1].trim().split("\n").filter((l) => l.trim()) : [];
  const visualMatch = text.match(/ANALISIS_VISUAL:\n([\s\S]*?)(?=\nRECOMENDACIONES:)/);
  const analisisVisual = visualMatch ? visualMatch[1].trim() : "";
  const recsMatch = text.match(/RECOMENDACIONES:\n([\s\S]*?)(?=\nVERSION_OPTIMIZADA:)/);
  const recomendaciones = recsMatch ? recsMatch[1].trim().split("\n").filter((l) => l.trim()) : [];
  const versionMatch = text.match(/VERSION_OPTIMIZADA:\n([\s\S]*?)$/);
  const versionOptimizada = versionMatch ? versionMatch[1].trim() : "";
  return { score, criterios, analisisVisual: analisisVisual === "N/A" ? "" : analisisVisual, recomendaciones, versionOptimizada };
}

function ScoreRing({ score, size = 130 }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const p = score ? (score / 10) * c : 0;
  const col = score >= 7.5 ? "#22c55e" : score >= 5 ? "#eab308" : "#ef4444";
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="8" strokeDasharray={c} strokeDashoffset={c - p} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 40, fontWeight: 800, color: col, fontFamily: "monospace" }}>{score?.toFixed(1) ?? "—"}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>/10</span>
      </div>
    </div>
  );
}

function Bar({ text, i }) {
  const m = text.match(/([\d.]+)\/10/);
  const v = m ? parseFloat(m[1]) : 0;
  const col = v >= 7.5 ? "#22c55e" : v >= 5 ? "#eab308" : "#ef4444";
  return (
    <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, marginBottom: 6 }}>{text}</div>
      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 2, background: col, width: (v / 10) * 100 + "%", transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

export default function Home() {
  const [adText, setAdText] = useState("");
  const [img, setImg] = useState(null);
  const [imgPrev, setImgPrev] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [msgIdx, setMsgIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const resRef = useRef(null);
  const fileRef = useRef(null);
  const abortRef = useRef(null);
  const msgs = ["Analizando hook...", "Evaluando senal...", "Midiendo friccion...", "Calculando score...", "Optimizando copy..."];
  useEffect(function() { if (!loading) return; var i1 = setInterval(function() { setMsgIdx(function(p) { return (p + 1) % msgs.length; }); }, 2000); var i2 = setInterval(function() { setElapsed(function(p) { return p + 1; }); }, 1000); return function() { clearInterval(i1); clearInterval(i2); }; }, [loading]);
  var onFile = function(e) { var f = e.target.files?.[0]; if (!f) return; if (["image/jpeg","image/png","image/gif","image/webp"].indexOf(f.type) === -1) { setError("Formato no soportado."); return; } if (f.size > 10*1024*1024) { setError("Max 10MB."); return; } setError(null); var reader = new FileReader(); reader.onload = function(ev) { setImg({ base64: ev.target.result.split(",")[1], mediaType: f.type, name: f.name }); setImgPrev(ev.target.result); }; reader.readAsDataURL(f); };
  var rmImg = function() { setImg(null); setImgPrev(null); if (fileRef.current) fileRef.current.value = ""; };
  var analyze = async function() { if ((!adText.trim() && !img) || loading) return; setLoading(true); setError(null); setResult(null); setMsgIdx(0); setElapsed(0); abortRef.current = new AbortController(); try { var body = { adText: adText.trim() || null }; if (img) body.image = { base64: img.base64, mediaType: img.mediaType }; var res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: abortRef.current.signal }); var data = await res.json(); if (!res.ok) throw new Error(data.error || "Error " + res.status); if (!data.result) throw new Error("Respuesta vacia"); var parsed = parseResponse(data.result); if (!parsed.score && !parsed.criterios.length) { setResult({ raw: data.result }); } else { setResult(parsed); } setTimeout(function() { resRef.current?.scrollIntoView({ behavior: "smooth" }); }, 200); } catch (err) { if (err.name === "AbortError") { setError("Cancelado."); } else { setError(err.message || "Error"); } } finally { setLoading(false); } };
  var cancel = function() { abortRef.current?.abort(); setLoading(false); };
  var reset = function() { setAdText(""); rmImg(); setResult(null); setError(null); };
  var copyText = function(t) { navigator.clipboard?.writeText(t); setCopied(true); setTimeout(function() { setCopied(false); }, 2000); };
  var hasInput = adText.trim() || img;
  var card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "system-ui, sans-serif", color: "#fff", padding: "20px 16px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 100, padding: "5px 14px", fontSize: 11, fontWeight: 600, color: "#a5b4fc", letterSpacing: 0.5, marginBottom: 14 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 8px #818cf8" }} />ALGORITMO ANDROMEDA
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #fff 40%, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Meta Ads Analyzer</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 6 }}>Copy + creativo = Diagnostico + version optimizada</p>
        </div>
        <div style={Object.assign({}, card, { marginBottom: 10 })}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8, display: "block" }}>Creativo (imagen)</label>
          {!imgPrev ? (<div onClick={function() { fileRef.current?.click(); }} style={{ border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 12, padding: "24px 16px", textAlign: "center", cursor: "pointer", background: "rgba(0,0,0,0.2)" }}><div style={{ fontSize: 28 }}>🖼️</div><div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>Clic para subir imagen</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>JPG, PNG, GIF, WebP - Max 10MB</div></div>) : (<div style={{ position: "relative" }}><img src={imgPrev} alt="" style={{ width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 10, background: "rgba(0,0,0,0.3)" }} /><button onClick={rmImg} style={{ position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: 7, background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>X</button><div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 6 }}><span style={{ color: "#22c55e" }}>OK</span> {img.name}</div></div>)}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={onFile} style={{ display: "none" }} />
        </div>
        <div style={Object.assign({}, card, { marginBottom: 16 })}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8, display: "block" }}>Copy del anuncio <span style={{ fontWeight: 400, textTransform: "none", opacity: 0.5 }}>(opcional si subes imagen)</span></label>
          <textarea value={adText} onChange={function(e) { setAdText(e.target.value); }} placeholder="Pega el texto del anuncio aqui..." style={{ width: "100%", minHeight: 120, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, lineHeight: 1.6, padding: 14, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginRight: "auto" }}>{img && adText.trim() ? "Imagen+Copy" : img ? "Imagen" : adText.length > 0 ? adText.length + " chars" : ""}</span>
            {result && (<button onClick={reset} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Limpiar</button>)}
            <button onClick={analyze} disabled={!hasInput || loading} style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: !hasInput || loading ? "rgba(99,102,241,0.15)" : "linear-gradient(135deg, #6366f1, #818cf8)", color: !hasInput || loading ? "rgba(255,255,255,0.25)" : "#fff", fontSize: 13, fontWeight: 700, cursor: !hasInput || loading ? "default" : "pointer" }}>{loading ? "Analizando..." : "Analizar"}</button>
          </div>
        </div>
        {loading && (<div style={Object.assign({ textAlign: "center", padding: "32px 16px" }, card)}><div style={{ width: 36, height: 36, border: "3px solid rgba(129,140,248,0.15)", borderTopColor: "#818cf8", borderRadius: "50%", animation: "sp 0.8s linear infinite", margin: "0 auto 12px" }} /><style dangerouslySetInnerHTML={{ __html: "@keyframes sp{to{transform:rotate(360deg)}}" }} /><p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "0 0 8px" }}>{msgs[msgIdx]}</p><p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0 }}>{elapsed}s</p><button onClick={cancel} style={{ marginTop: 12, padding: "6px 16px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>Cancelar</button></div>)}
        {error && (<div style={{ padding: 14, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 13 }}>Error: {error}</div>)}
        {result && !result.raw && (
          <div ref={resRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={Object.assign({}, card, { display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" })}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Score General</span>
              <ScoreRing score={result.score} />
              <span style={{ marginTop: 10, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, color: result.score >= 7.5 ? "#22c55e" : result.score >= 5 ? "#eab308" : "#ef4444", background: result.score >= 7.5 ? "rgba(34,197,94,0.1)" : result.score >= 5 ? "rgba(234,179,8,0.1)" : "rgba(239,68,68,0.1)" }}>{result.score >= 8 ? "Excelente" : result.score >= 6.5 ? "Bueno" : result.score >= 5 ? "Mejorable" : "Necesita trabajo"}</span>
            </div>
            <div style={card}><h3 style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 0.5, textTransform: "uppercase", margin: "0 0 12px" }}>Diagnostico</h3><div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{result.criterios.map(function(c, i) { return <Bar key={i} text={c} i={i} />; })}</div></div>
            {result.analisisVisual && (<div style={Object.assign({}, card, { background: "rgba(168,85,247,0.04)", borderColor: "rgba(168,85,247,0.15)" })}><h3 style={{ fontSize: 12, fontWeight: 700, color: "rgba(216,180,254,0.7)", letterSpacing: 0.5, textTransform: "uppercase", margin: "0 0 10px" }}>Analisis Visual</h3><p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{result.analisisVisual}</p></div>)}
            {result.recomendaciones.length > 0 && (<div style={Object.assign({}, card, { background: "rgba(59,130,246,0.04)", borderColor: "rgba(99,102,241,0.15)" })}><h3 style={{ fontSize: 12, fontWeight: 700, color: "rgba(165,180,252,0.7)", letterSpacing: 0.5, textTransform: "uppercase", margin: "0 0 12px" }}>Recomendaciones</h3>{result.recomendaciones.map(function(r, i) { return (<div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}><span style={{ minWidth: 20, height: 20, borderRadius: 5, background: "rgba(99,102,241,0.15)", color: "#a5b4fc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{i + 1}</span><span>{r.replace(/^\d+\.\s*/, "")}</span></div>); })}</div>)}
            {result.versionOptimizada && (<div style={Object.assign({}, card, { background: "rgba(34,197,94,0.03)", borderColor: "rgba(34,197,94,0.15)" })}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><h3 style={{ fontSize: 12, fontWeight: 700, color: "rgba(134,239,172,0.7)", letterSpacing: 0.5, textTransform: "uppercase", margin: 0 }}>Version Optimizada</h3><button onClick={function() { copyText(result.versionOptimizada); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.1)", color: "#86efac", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{copied ? "Copiado!" : "Copiar"}</button></div><div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 14, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap" }}>{result.versionOptimizada}</div></div>)}
          </div>
        )}
        {result?.raw && (<div ref={resRef} style={Object.assign({}, card, { fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.75)", whiteSpace: "pre-wrap" })}>{result.raw}</div>)}
        <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.12)", marginTop: 28 }}>Powered by Claude - Algoritmo Andromeda</p>
      </div>
    </div>
  );
}
