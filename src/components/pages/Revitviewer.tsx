import React, { useEffect, useState } from "react";
import "../ui/styles/RevitViewer.css";

const MODEL_API = "http://45.198.13.98:9000";
const BIMUI_API = "http://45.198.13.98:8001";

let viewerScriptPromise: Promise<void> | null = null;

function loadViewer() {
  if (!viewerScriptPromise) {
    viewerScriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js";
      s.onload = () => resolve();
      s.onerror = () => reject("Failed to load Forge Viewer");
      document.head.appendChild(s);
    });
  }
  return viewerScriptPromise;
}

type RevitViewerProps = {
  stepFilePath?: string | null;
};

const RevitViewer: React.FC<RevitViewerProps> = ({ stepFilePath }) => {
  const [urn, setUrn] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [viewer, setViewer] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const log = (m: string) => {
    console.log(m);
    setLogs((l) => [...l, `${new Date().toLocaleTimeString()}: ${m}`]);
  };

  useEffect(() => {
    return () => viewer?.finish?.();
  }, [viewer]);

  // Automatically upload and view the STEP file if path is provided
  useEffect(() => {
    if (!stepFilePath) {
      log("[DEBUG] No STEP file path provided to RevitViewer.");
      return;
    }
    (async () => {
      try {
        setUploading(true);
        setUploadProgress(5);
        setLogs([]);
        log(`[DEBUG] Fetching STEP file from model API: ${stepFilePath}`);
        const downloadUrl = `${MODEL_API}/download-step?path=${encodeURIComponent(stepFilePath)}`;
        log(`[DEBUG] GET ${downloadUrl}`);
        const res = await fetch(downloadUrl);
        log(`[DEBUG] STEP file fetch status: ${res.status}`);
        if (!res.ok) throw new Error(`Failed to fetch STEP file: ${res.statusText}`);
        const blob = await res.blob();

        setUploadProgress(20);
        log("[DEBUG] Uploading STEP file to BIMui API...");
        const fd = new FormData();
        fd.append("file", new File([blob], "pred.step", { type: "application/octet-stream" }));
        const up = await fetch(`${BIMUI_API}/upload-rvt`, {
          method: "POST",
          body: fd,
        });
        log(`[DEBUG] BIMui /upload-rvt status: ${up.status}`);
        if (!up.ok) {
          const err = await up.text();
          log(`[DEBUG] Upload response: ${err}`);
          throw new Error("Upload failed: " + err);
        }
        setUploadProgress(50);
        const { urn: newUrn } = await up.json();
        setUrn(newUrn);
        log(`[DEBUG] Upload complete – URN: ${newUrn}`);

        // Poll for translation
        log("[DEBUG] ⏳ Translating…");
        let status = "pending", tries = 0;
        while (status === "pending" && tries < 120) {
          await new Promise((r) => setTimeout(r, 3000));
          const st = await fetch(`${BIMUI_API}/status/${newUrn}`).then((r) => r.json());
          status = st.status;
          setUploadProgress(Math.min(60 + (tries / 120) * 30, 90));
          log(`[DEBUG] ⏳ Status: ${status} ${st.progress || ""}`);
          if (status === "failed") throw new Error("Translation failed");
          tries++;
        }
        if (status !== "success") throw new Error("Translation timed out");
        log("[DEBUG] ✅ Translation done");
        setUploadProgress(95);

        // Initialize viewer
        const { access_token } = await fetch(`${BIMUI_API}/token`).then((r) => r.json());
        log("[DEBUG] 🔑 Got token");
        await loadViewer();
        log("[DEBUG] 🔥 Starting viewer");
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
                    log("[DEBUG] 👀 Model loaded");
                    setUploadProgress(100);
                  });
                } else {
                  log("[DEBUG] ❌ No viewable geometry");
                  setUploadProgress(100);
                }
              },
              (err) => {
                log("[DEBUG] Viewer error: " + JSON.stringify(err));
                setUploadProgress(100);
              }
            );
            setViewer(v);
          }
        );
      } catch (err: any) {
        log("[DEBUG] ❌ " + (err.message || err));
        setUploadProgress(0);
      } finally {
        setUploading(false);
      }
    })();
    // eslint-disable-next-line
  }, [stepFilePath]);

  // Download the processed model from BIMui
  async function downloadDerivative() {
    if (!urn) return;
    log("[DEBUG] ⬇ Downloading…");
    const res = await fetch(`${BIMUI_API}/download/${urn}`);
    if (!res.ok) return log("[DEBUG] ❌ Download failed");
    const disp = res.headers.get("Content-Disposition") || "";
    const m = /filename="?([^"]+)"?/.exec(disp);
    const filename = m ? m[1] : "download";
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
      <header className="controls-header">
        {urn && (
          <button
            onClick={downloadDerivative}
            className="btn-secondary"
          >
            Download Model
          </button>
        )}
      </header>
      <main className="viewer-container">
        <div id="forge" />
        <div className="logs">
          {logs.map((l, i) => (
            <div key={i} className="logline">{l}</div>
          ))}
          {uploading && <div>Progress: {uploadProgress}%</div>}
        </div>
      </main>
    </div>
  );
};

export default RevitViewer;
