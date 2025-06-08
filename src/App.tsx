import React, { useState, useEffect } from "react";
import History from "./components/pages/History";
import Chatbot from "./components/pages/Chatbot";
import ScratchPad from "./components/pages/Scratchpad";
import RevitViewer from "./components/pages/Revitviewer";

function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [stepFilePath, setStepFilePath] = useState<string | null>(null);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="min-h-screen min-w-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 p-2">
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded shadow"
        >
          {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
        </button>
      </div>
      <div className="
        grid h-[90vh] w-full gap-4
        grid-cols-1
        md:grid-cols-[1fr_2fr_2fr]
      ">
        <div className="rounded-xl p-4 bg-gray-100 dark:bg-gray-900 shadow h-full">
          <History />
        </div>
        <div className="flex flex-col h-full gap-4">
          <div className="rounded-xl bg-gray-100 dark:bg-gray-900 shadow p-4" style={{ height: 220 }}>
            <Chatbot setStepFilePath={setStepFilePath} />
          </div>
          <div className="flex-1 min-h-[120px]">
            <ScratchPad />
          </div>
        </div>
        <div className="rounded-xl p-4 bg-gray-100 dark:bg-gray-900 shadow h-full">
          <RevitViewer stepFilePath={stepFilePath} />
        </div>
      </div>
    </div>
  );
}
export default App;
