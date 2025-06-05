import React, { useState, useEffect } from "react";
import "../ui/styles/RevitViewer.css";

const API = "http://localhost:8000";
let viewerScriptPromise: Promise<void> | null = null;

function loadViewer() {
  if (!viewerScriptPromise) {
    viewerScriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src =
        "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js";
      s.onload = () => resolve();
      s.onerror = () => reject("Failed to load Forge Viewer");
      document.head.appendChild(s);
    });
  }
  return viewerScriptPromise;
}

export default function RevitViewer() {
  const [urn, setUrn] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [viewer, setViewer] = useState<Autodesk.Viewing.GuiViewer3D | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const log = (m: string) => {
    console.log(m);
    setLogs((l) => [...l, `${new Date().toLocaleTimeString()}: ${m}`]);
  };

  // load supported formats once
  useEffect(() => {
    fetch(`${API}/supported-formats`)
      .then((r) => r.json())
      .then((data) => setSupportedFormats(data))
      .catch((err) => log("Failed to load supported formats: " + err));
  }, []);

  // cleanup viewer when unmounting or resetting
  useEffect(() => {
    return () => viewer?.finish();
  }, [viewer]);

  // file chooser
  function choose(e: React.ChangeEvent<HTMLInputElement>) {
    if (viewer) {
      viewer.finish();
      setViewer(null);
    }
    setLogs([]);
    setUploadProgress(0);
    const files = e.target.files;
    if (files && files.length) setFile(files[0]);
  }

  // upload, translate, and show in Forge Viewer
  async function run() {
    if (!file) return log("Pick a file first");

    const name = file.name.toLowerCase();
    const isRFA = name.endsWith(".rfa");
    const isRVT = name.endsWith(".rvt");
    const isIFC = name.endsWith(".ifc");
    const isSTEP = name.endsWith(".step") || name.endsWith(".stp");
    const sizeMB = file.size / 1024 / 1024;

    log(`Selected file: ${file.name} (${sizeMB.toFixed(2)} MB)`);
    if (isRFA) {
      return log("❌ RFA not supported. Convert to RVT first.");
    }
    if (!isRVT && !isIFC && !isSTEP) {
      log("❌ Only .rvt, .ifc and .step/.stp supported");
      log(
        "📋 Supported: " +
          (supportedFormats
            ? Object.values(supportedFormats.supported_formats).flat().join(", ")
            : "loading…")
      );
      return;
    }
    if (sizeMB > 100) {
      log(`⚠️ Large file (${sizeMB.toFixed(2)} MB) may take a while`);
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const fd = new FormData();
      fd.append("file", file);
      log(`⬆ Uploading…`);
      setUploadProgress(20);

      const up = await fetch(`${API}/upload-rvt`, {
        method: "POST",
        body: fd,
        signal: AbortSignal.timeout(30 * 60 * 1000),
      });
      if (!up.ok) {
        const err = await up.text();
        throw new Error("Upload failed: " + err);
      }
      setUploadProgress(50);
      const { urn: newUrn } = await up.json();
      setUrn(newUrn);
      log(`✔ Upload complete – URN: ${newUrn}`);
      setUploadProgress(60);

      // poll for translation
      log("⏳ Translating…");
      let status = "pending",
        tries = 0;
      while (status === "pending" && tries < 120) {
        await new Promise((r) => setTimeout(r, 3000));
        const st = await fetch(`${API}/status/${newUrn}`).then((r) => r.json());
        status = st.status;
        setUploadProgress(Math.min(60 + (tries / 120) * 30, 90));
        log(`⏳ Status: ${status} ${st.progress || ""}`);
        if (status === "failed") throw new Error("Translation failed");
        tries++;
      }
      if (status !== "success") throw new Error("Translation timed out");
      log("✅ Translation done");
      setUploadProgress(95);

      // initialize viewer
      const { access_token } = await fetch(`${API}/token`).then((r) => r.json());
      log("🔑 Got token");
      await loadViewer();
      log("🔥 Starting viewer");
      Autodesk.Viewing.Initializer(
        { env: "AutodeskProduction", api: "derivativeV2", accessToken: access_token },
        () => {
          const div = document.getElementById("forge")!;
          const v = new Autodesk.Viewing.GuiViewer3D(div);
          v.start();
          Autodesk.Viewing.Document.load(
            `urn:${newUrn}`,
            (doc) => {
              const viewable =
                doc.getRoot().getDefaultGeometry() ||
                doc.getRoot().search({ type: "geometry" })[0];
              if (viewable) {
                v.loadDocumentNode(doc, viewable).then(() => {
                  log("👀 Model loaded");
                  setUploadProgress(100);
                });
              } else {
                log("❌ No viewable geometry");
                setUploadProgress(100);
              }
            },
            (err) => {
              log("Viewer error: " + JSON.stringify(err));
              setUploadProgress(100);
            }
          );
          setViewer(v);
        }
      );
    } catch (err: any) {
      log("❌ " + (err.message || err));
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  }

  // download original/derivative
  async function downloadDerivative() {
    if (!urn) return;
    log("⬇ Downloading…");
    const res = await fetch(`${API}/download/${urn}`);
    if (!res.ok) return log("❌ Download failed");
    const disp = res.headers.get("Content-Disposition") || "";
    const m = /filename="?([^"]+)"?/.exec(disp);
    const filename = m ? m[1] : file?.name || "download";
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="revit-root">
      {/* Top row: controls only */}
      <header className="controls-header">
        <input
          type="file"
          accept=".rvt,.rfa,.ifc,.step,.stp"
          onChange={choose}
          disabled={uploading}
          className="file-input"
        />
        <button
          onClick={run}
          disabled={!file || uploading}
          className="btn-primary"
        >
          {uploading ? "Processing…" : "Upload & View"}
        </button>
        {urn && (
          <button
            onClick={downloadDerivative}
            className="btn-secondary"
          >
            Download Model
          </button>
        )}
      </header>

      {/* Bottom row: full-height Forge viewer */}
      <main className="viewer-container">
        <div id="forge" />
      </main>
    </div>
  );
}