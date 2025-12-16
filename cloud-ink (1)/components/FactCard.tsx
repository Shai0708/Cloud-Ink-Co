import React, { useState, useEffect, useRef } from 'react';

interface FactCardProps {
  title: string;
  value: number | null;
  icon: React.ReactNode;
  borderColor: string;
}

const FactCard: React.FC<FactCardProps> = ({ title, value, icon, borderColor }) => {
  const [count, setCount] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIntersecting] = useState(false);
  const duration = 1500; // 1.5 seconds

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.5,
      }
    );

    const currentRef = cardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    if (isIntersecting && value !== null) {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        setCount(Math.floor(progress * value));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [value, isIntersecting]);

  return (
    <div 
      ref={cardRef}
      className="group min-h-32 w-full rounded-lg shadow-md p-4 flex items-center gap-4 bg-[#111827] border"
      style={{ borderColor: borderColor }}
    >
      <div>
        {icon}
      </div>
      <div className="flex flex-col">
        <p className="text-3xl font-bold text-white">
          {value === null ? '...' : count}
        </p>
        <h3 className="text-xs font-medium text-gray-400 mt-1">
          {title}
        </h3>
      </div>
    </div>
  );
};

export default FactCard;