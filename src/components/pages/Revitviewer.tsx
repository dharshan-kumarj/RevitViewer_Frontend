import React, { useState, useEffect } from "react";
import "../../index.css";

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

  useEffect(() => {
    fetch(`${API}/supported-formats`)
      .then(r => r.json())
      .then(data => setSupportedFormats(data))
      .catch(err => log("Failed to load supported formats: " + err));
  }, []);

  function choose(e: React.ChangeEvent<HTMLInputElement>) {
    if (viewer) {
      viewer.finish();
      setViewer(null);
    }
    setLogs([]);
    setUploadProgress(0);
    if (e.target.files?.length) setFile(e.target.files[0]);
  }

  async function run() {
    if (!file) return log("Pick a file first");

    const name = file.name.toLowerCase();
    const isRFA = name.endsWith(".rfa");
    const isRVT = name.endsWith(".rvt");
    const isIFC = name.endsWith(".ifc");
    const fileSizeMB = file.size / (1024 * 1024);

    log(`Selected file: ${file.name} (${fileSizeMB.toFixed(2)} MB)`);

    if (isRFA) {
      log("❌ RFA files are not supported. Convert to RVT first.");
      return;
    }
    if (!isRVT && !isIFC) {
      log("❌ Only .rvt and .ifc files are supported");
      log(
        "📋 Supported formats: " +
          (supportedFormats
            ? Object.values(supportedFormats.supported_formats).flat().join(", ")
            : "loading…")
      );
      return;
    }
    if (fileSizeMB > 100) {
      log(`⚠️ Large file detected (${fileSizeMB.toFixed(2)} MB). Might take a while.`);
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const fd = new FormData();
      fd.append("file", file);
      log(`⬆ Uploading ${isIFC ? ".ifc" : ".rvt"} file …`);
      setUploadProgress(20);

      const up = await fetch(`${API}/upload-rvt`, {
        method: "POST",
        body: fd,
        signal: AbortSignal.timeout(30 * 60 * 1000), // 30 minutes
      });
      if (!up.ok) {
        const err = await up.text();
        throw new Error("Upload failed: " + err);
      }
      setUploadProgress(50);

      const { urn: newUrn } = await up.json();
      setUrn(newUrn);
      log(`✔ Upload complete! URN → ${newUrn}`);
      setUploadProgress(60);

      // Poll
      log("⏳ Waiting for translation…");
      let status = "pending",
        tries = 0;
      while (status === "pending" && tries < 120) {
        await new Promise((r) => setTimeout(r, 3000));
        const st = await fetch(`${API}/status/${newUrn}`).then((r) => r.json());
        status = st.status;
        setUploadProgress(Math.min(60 + (tries / 120) * 30, 90));
        log(`⏳ Translation status: ${status} ${st.progress || ""}`);
        if (status === "failed") throw new Error("❌ Translation failed.");
        tries++;
      }
      if (status !== "success") throw new Error("❌ Translation timed out.");
      log("✅ Translation complete");
      setUploadProgress(95);

      // Viewer
      const { access_token } = await fetch(`${API}/token`).then((r) => r.json());
      log("🔑 Got viewer token");
      await loadViewer();
      log("🔥 Initializing viewer");
      Autodesk.Viewing.Initializer(
        { env: "AutodeskProduction", api: "derivativeV2", accessToken: access_token },
        () => {
          const div = document.getElementById("forge")!;
          const v = new Autodesk.Viewing.GuiViewer3D(div);
          v.start();
          Autodesk.Viewing.Document.load(
            `urn:${newUrn}`,
            (doc) => {
              const vm = doc.getRoot().getDefaultGeometry() || doc.getRoot().search({ type: "geometry" })[0];
              if (vm) {
                v.loadDocumentNode(doc, vm).then(() => {
                  log("👀 Model loaded successfully");
                  setUploadProgress(100);
                });
              } else {
                log("❌ No viewable geometry found");
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
    } catch (error: any) {
      log("❌ Error: " + (error.message || error));
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  }

  async function downloadDerivative() {
    if (!urn) return;
    log("⬇ Downloading original file…");
    const res = await fetch(`${API}/download/${urn}`);
    if (!res.ok) return log("❌ Download failed");

    // pick up the actual filename from Content-Disposition or fallback to the original
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

  useEffect(() => () => viewer?.finish(), [viewer]);

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">APS Revit ▶ Viewer</h1>
      <div className="bg-yellow-50 border-yellow-200 rounded p-4">
        <h2 className="font-semibold text-yellow-800">Important:</h2>
        <p className="text-yellow-700 text-sm mt-1">
          RFA files are not directly supported. Please convert to RVT first. Supported here:
          <strong>.rvt</strong> and <strong>.ifc</strong>. Large files may take a few minutes.
        </p>
      </div>

      <input
        type="file"
        accept=".rvt,.rfa,.ifc"
        onChange={choose}
        disabled={uploading}
        className="block w-full text-sm file:px-4 file:py-2
                   file:bg-blue-600 file:text-white file:rounded
                   hover:file:bg-blue-700 disabled:opacity-50"
      />

      {file && (
        <div className="text-sm text-gray-600">
          Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          {file.size > 50 * 1024 * 1024 && (
            <div className="text-orange-600 font-medium">
              ⚠️ Large file – upload may take several minutes
            </div>
          )}
        </div>
      )}

      {uploading && (
        /* ... your existing progress bar ... */
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
          <div className="text-sm text-gray-600 mt-1">
            {uploadProgress < 60
              ? "Uploading..."
              : uploadProgress < 90
              ? "Translating..."
              : "Loading viewer..."}
          </div>
        </div>
      )}

      <button
        onClick={run}
        disabled={!file || uploading}
        className="py-2 px-4 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {uploading ? "Processing..." : "Upload & View"}
      </button>

      {urn && (
        <button
          onClick={downloadDerivative}
          className="mt-4 py-2 px-4 bg-green-600 text-white rounded"
        >
          Download Rendered Model
        </button>
      )}

      <ul className="bg-gray-100 rounded p-4 text-xs space-y-1 h-40 overflow-y-auto">
        {logs.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>

      <div id="forge" className="border rounded w-full h-[600px]" />
    </main>
  );
}