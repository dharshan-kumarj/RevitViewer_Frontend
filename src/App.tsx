import React, { useState, useEffect } from "react";
import History from "./components/pages/History";
import Chatbot from "./components/pages/Chatbot";
import ScratchPad from "./components/pages/Scratchpad";
import RevitViewer from "./components/pages/Revitviewer";

function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

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
        grid
        h-[90vh] w-full
        gap-4
        grid-cols-1 grid-rows-[auto_auto_auto_auto]
        md:grid-cols-[1fr_2fr_2fr] md:grid-rows-[1fr_1fr]
        md:h-[80vh]
      ">
        {/* History (left, spans 2 rows) */}
        <div className="
          rounded-xl 
          p-4 
          bg-gray-100 dark:bg-gray-900 
          shadow 
          md:row-span-2
        ">
          <History />
        </div>
        {/* Chatbot (top middle) */}
        <div className="
          rounded-xl 
          p-4 
          bg-gray-100 dark:bg-gray-900
          shadow
        ">
          <Chatbot />
        </div>
        {/* Revit viewer (right, spans 2 rows) */}
        <div className="
          rounded-xl 
          p-4 
          bg-gray-100 dark:bg-gray-900
          shadow
          md:row-span-2
        ">
          <RevitViewer />
        </div>
        {/* Scratch pad (bottom middle) */}
        <div className="
          rounded-xl 
          p-4 
          bg-gray-100 dark:bg-gray-900
          shadow
          md:col-start-2
        ">
          <ScratchPad />
        </div>
      </div>
    </div>
  );
}

export default App;