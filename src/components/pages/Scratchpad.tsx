import React from "react";

const ScratchPad: React.FC = () => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <span className="text-lg font-bold">Scratch pad</span>
      {/* Placeholder for scratch drawing */}
      <div className="mt-4 w-24 h-12">
        {/* You can replace this with an actual drawing canvas */}
        <svg width="100%" height="100%">
          <path
            d="M10 35 Q 30 5 60 35"
            stroke="white"
            strokeWidth="4"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
};

export default ScratchPad;
