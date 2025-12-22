import React from 'react';

interface SpeedometerProps {
  speed: number | null;
  error: string | null;
}

const Speedometer: React.FC<SpeedometerProps> = ({ speed, error }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full min-h-0">
      {/* Decorative Gauge Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Outer Glow Ring */}
        <div className="absolute w-[45vh] h-[45vh] landscape:w-[65vh] landscape:h-[65vh] rounded-full border-2 border-dash-accent/10 blur-xl animate-pulse"></div>

        {/* SVG Gauge */}
        <svg className="w-[42vh] h-[42vh] landscape:w-[62vh] landscape:h-[62vh] transform -rotate-90">
          <circle
            cx="50%" cy="50%" r="48%"
            stroke="currentColor" strokeWidth="2" fill="transparent"
            className="text-dash-border/30"
          />
          <circle
            cx="50%" cy="50%" r="48%"
            stroke="currentColor" strokeWidth="6" fill="transparent"
            strokeDasharray="1 4"
            className="text-dash-accent/40"
          />
          <circle
            cx="50%" cy="50%" r="48%"
            stroke="currentColor" strokeWidth="4" fill="transparent"
            strokeDasharray="300%"
            strokeDashoffset={`${300 - (Number(speed || 0) / 100) * 300}%`}
            className="text-dash-accent drop-shadow-[0_0_8px_rgba(255,77,0,0.8)] transition-all duration-500 ease-out"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="z-10 flex flex-col items-center justify-center transform -skew-x-12">
        <span className="text-dash-cyan text-[2vh] landscape:text-[3vh] font-black tracking-[0.4em] uppercase mb-1 font-orbitron drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">KM/H</span>

        {/* Speed Number */}
        <div className="text-[28vh] landscape:text-[45vh] leading-[0.7] font-[900] text-dash-text font-orbitron tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
          {speed !== null ? speed : '0'}
        </div>

        {/* Indicators */}
        <div className="flex space-x-4 mt-4 font-orbitron font-bold">
          <div className={`text-[1.5vh] px-2 py-0.5 border ${error ? 'border-dash-red text-dash-red animate-blink' : 'border-dash-cyan/20 text-dash-cyan/40'}`}>
            GPS
          </div>
          <div className={`text-[1.5vh] px-2 py-0.5 border ${speed !== null ? 'border-dash-accent text-dash-accent' : 'border-dash-cyan/20 text-dash-cyan/40'}`}>
            LIVE
          </div>
        </div>

        {/* Debug/Status info */}
        {error && (
          <div className="absolute -bottom-10 text-dash-red text-[1.2vh] uppercase font-bold tracking-widest bg-dash-red/10 px-4 py-1 border border-dash-red/50">
            SENSOR_FAIL: {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Speedometer;