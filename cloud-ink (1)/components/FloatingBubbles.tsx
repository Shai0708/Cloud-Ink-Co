import React, { useMemo } from 'react';

const FloatingBubbles: React.FC = () => {
  const bubbles = useMemo(() => {
    const bubbleCount = 20; // Number of bubbles
    return Array.from({ length: bubbleCount }).map((_, i) => {
      const size = `${Math.random() * 80 + 20}px`; // Size between 20px and 100px
      return {
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          width: size,
          height: size,
          animationDuration: `${Math.random() * 20 + 15}s`, // Duration between 15s and 35s
          animationDelay: `${Math.random() * 10}s`, // Delay up to 10s
        },
      };
    });
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-full -z-10" aria-hidden="true">
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="absolute bottom-[-100px] rounded-full bg-cyan-500/10 animate-floatUp"
          style={bubble.style}
        />
      ))}
    </div>
  );
};

export default FloatingBubbles;
