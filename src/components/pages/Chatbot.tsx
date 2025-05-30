import React from "react";

const Chatbot: React.FC = () => {
  return (
    <div className="flex flex-col h-full w-full justify-between">
      <span className="text-lg font-bold">Chatbot</span>
      <div className="flex-1" />
      <div className="flex justify-center mt-2">
        <input
          type="text"
          className="w-3/4 px-3 py-2 rounded-lg border border-white bg-transparent text-white"
          placeholder="Type a message..."
          disabled
        />
      </div>
    </div>
  );
};

export default Chatbot;