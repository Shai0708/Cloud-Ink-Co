import React from 'react';
import VitalityLine from './VitalityLine';

const Hero: React.FC = () => {
  return (
    <div className="relative text-center py-16 md:py-24 rounded-xl overflow-hidden bg-[#111827]">
      <div className="absolute inset-0 bg-gradient-to-r from-[#1f2937] via-[#4b5563] to-[#111827] opacity-50"></div>
      
      <VitalityLine />

      <div className="relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
          Welcome to Cloud Ink Hospital
        </h1>
        <p className="mt-4 text-lg md:text-xl text-[#A9B4C2]">
          Where technology empowers compassionate care.
        </p>
      </div>
    </div>
  );
};

export default Hero;