import React, { useState } from "react";

const BACKEND_URL = "http://45.198.13.98:9000/chatbot";

const Chatbot: React.FC<{ setStepFilePath: (path: string | null) => void }> = ({ setStepFilePath }) => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      setResponse(data.output || "No response from model.");
      setStepFilePath(data.step_file_path || null);
    } catch (e) {
      setResponse("Error contacting backend.");
      setStepFilePath(null);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full w-full justify-between">
      <span className="text-lg font-bold">Chatbot</span>
      <div className="flex-1 overflow-y-auto my-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
        {loading ? (
          <span className="text-sm text-gray-400">Thinking...</span>
        ) : (
          <span className="text-base">{response}</span>
        )}
      </div>
      <div className="flex justify-center mt-2 gap-2">
        <input
          type="text"
          className="w-3/4 px-3 py-2 rounded-lg border border-white bg-transparent text-white"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          disabled={loading}
        >Send</button>
      </div>
    </div>
  );
};

export default Chatbot;
