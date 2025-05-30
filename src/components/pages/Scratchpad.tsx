import React, { useRef, useState, useEffect } from "react";

const ScratchPad: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState(false);

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
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for sharp drawing
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Drawing logic
  const getPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    };
  };

  const startDraw = (e: React.MouseEvent) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const endDraw = () => setDrawing(false);

  // Snap logic: Download canvas as image
  const handleSnap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "scratchpad.png";
    link.click();
  };

  // Clear canvas
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div
      ref={parentRef}
      className="flex flex-col items-center justify-center w-full h-full relative"
      style={{ minHeight: 0, minWidth: 0, flex: 1 }}
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
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
      ></canvas>
    </div>
  );
};

export default ScratchPad;