import React from 'react';

const BootScreen: React.FC = () => {
  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center relative">
      <div className="flex flex-wrap w-[80px] h-[80px] gap-1 animate-pulse">
        <div className="w-[38px] h-[38px] bg-[#0078D4]"></div>
        <div className="w-[38px] h-[38px] bg-[#0078D4]"></div>
        <div className="w-[38px] h-[38px] bg-[#0078D4]"></div>
        <div className="w-[38px] h-[38px] bg-[#0078D4]"></div>
      </div>
      
      <div className="absolute bottom-32 flex items-center justify-center">
        <div className="loader"></div>
      </div>

      <style>{`
        .loader {
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-left-color: #0078D4;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BootScreen;
