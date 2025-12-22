import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    return { time: `${hours}:${strMinutes}`, ampm };
  };

  const { time: timeStr, ampm } = formatTime(time);

  return (
    <div className="flex flex-col items-center justify-center pt-6 pb-2">
      <div className="flex items-baseline space-x-2">
        <h1 className="text-6xl font-bold text-dash-text tracking-tight font-mono">
          {timeStr}
        </h1>
        <span className="text-2xl font-bold text-dash-accent">{ampm}</span>
      </div>
      <div className="text-dash-muted text-sm mt-1 uppercase tracking-widest">
        {time.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
};

export default Clock;