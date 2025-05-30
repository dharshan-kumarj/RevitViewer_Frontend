import React, { useRef, useState, useEffect } from "react";

type Point = { x: number; y: number };
type Path = Point[];

const getTheme = () =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 220;

const ScratchPad: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<"dark" | "light">(getTheme());
  const [drawing, setDrawing] = useState(false);
  const [paths, setPaths] = useState<Path[]>([]);
  const [currentPath, setCurrentPath] = useState<Path>([]);
  const [height, setHeight] = useState<number>(DEFAULT_HEIGHT);
  const [resizing, setResizing] = useState(false);

  // Listen for theme change
  useEffect(() => {
    const updateTheme = () => setTheme(getTheme());
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Resize canvas to fill parent
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const parent = parentRef.current;
      if (canvas && parent) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = parent.offsetWidth * dpr;
        canvas.height = parent.offsetHeight * dpr;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        redrawAll();
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
    // eslint-disable-next-line
  }, [paths, theme, height]);

  // Redraw all paths when theme or paths change
  useEffect(() => {
    redrawAll();
    // eslint-disable-next-line
  }, [theme, paths]);

  // Resizing logic
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing || !parentRef.current) return;
      const parent = parentRef.current;
      const rect = parent.getBoundingClientRect();
      let newHeight = e.clientY - rect.top;
      if (newHeight < MIN_HEIGHT) newHeight = MIN_HEIGHT;
      if (newHeight > MAX_HEIGHT) newHeight = MAX_HEIGHT;
      setHeight(newHeight);
    };
    const onUp = () => setResizing(false);

    if (resizing) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizing]);

  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    };
  };

  const handlePointerDown = (e: React.MouseEvent) => {
    setDrawing(true);
    const pos = getCanvasPos(e);
    setCurrentPath([pos]);
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    const pos = getCanvasPos(e);
    setCurrentPath(path => {
      const newPath = [...path, pos];
      drawPathSegment(path[path.length - 1], pos, theme);
      return newPath;
    });
  };

  const handlePointerUp = () => {
    if (drawing && currentPath.length > 1) {
      setPaths(paths => [...paths, currentPath]);
    }
    setCurrentPath([]);
    setDrawing(false);
  };

  // Draw a segment (only when drawing)
  const drawPathSegment = (from: Point, to: Point, mode: "dark" | "light") => {
    const canvas = canvasRef.current;
    if (!canvas || !from || !to) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = mode === "dark" ? "#fff" : "#000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  // Redraw all paths according to current theme
  const redrawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.strokeStyle = theme === "dark" ? "#fff" : "#000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (const path of paths) {
      if (path.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; ++i) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  // Download as image
  const handleSnap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "scratchpad.png";
    link.click();
  };

  // Clear everything
  const handleClear = () => {
    setPaths([]);
    setCurrentPath([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div
      ref={parentRef}
      className="flex flex-col items-center justify-center w-full relative select-none rounded-xl bg-gray-100 dark:bg-gray-900 shadow"
      style={{ minHeight: MIN_HEIGHT, height, maxHeight: MAX_HEIGHT, transition: "height 0.1s" }}
    >
      <div className="flex w-full justify-between items-center mb-2 z-10 pointer-events-none">
        <span className="text-lg font-bold pointer-events-auto">Scratch pad</span>
        <div className="pointer-events-auto">
          <button
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-800 mr-2"
            onClick={handleSnap}
          >
            Take a Snap
          </button>
          <button
            className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-800"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded bg-transparent dark:bg-gray-800"
        style={{ touchAction: "none", cursor: "crosshair", flex: 1 }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
      />
      {/* resize handle at the bottom */}
      <div
        className="w-full flex justify-center cursor-row-resize select-none"
        style={{ height: "18px", marginTop: "-8px", zIndex: 20, position: "relative" }}
        onMouseDown={() => setResizing(true)}
      >
        <div className="w-10 h-2 bg-gray-400 dark:bg-gray-600 rounded-full" />
      </div>
    </div>
  );
};

export default ScratchPad;