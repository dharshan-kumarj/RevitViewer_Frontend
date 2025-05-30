import React from "react";
import History from "./components/pages/History";
import Chatbot from "./components/pages/Chatbot";
import ScratchPad from "./components/pages/Scratchpad";
import RevitViewer from "./components/pages/Revitviewer";

function App() {
  return (
    <div className="h-screen w-screen bg-black text-white p-4">
      <div
        className="
          grid 
          grid-cols-[1fr_2fr_2fr] 
          grid-rows-[2fr_1fr] 
          gap-2 
          h-full w-full 
          rounded-2xl border border-white
        "
        style={{
          gridTemplateAreas: `
            "history chatbot revit"
            "history scratchpad revit"
          `
        }}
      >
        <div className="row-span-2 rounded-xl border border-white p-4" style={{ gridArea: "history" }}>
          <History />
        </div>
        <div className="rounded-xl border border-white p-4" style={{ gridArea: "chatbot" }}>
          <Chatbot />
        </div>
        <div className="rounded-xl border border-white p-4" style={{ gridArea: "scratchpad" }}>
          <ScratchPad />
        </div>
        <div className="row-span-2 rounded-xl border border-white p-4" style={{ gridArea: "revit" }}>
          <RevitViewer />
        </div>
      </div>
    </div>
  );
}

export default App;