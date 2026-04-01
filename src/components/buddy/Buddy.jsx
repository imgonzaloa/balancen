import React from 'react';

export default function Buddy({ pose = 'disappointed', size = 120, message }) {
  const poses = {
    celebrating:  { x: 0,  y: 0 },
    disappointed: { x: 50, y: 0 },
    competitive:  { x: 0,  y: 25 },
    friendly:     { x: 50, y: 25 },
    proud:        { x: 0,  y: 50 },
    waiting:      { x: 50, y: 50 },
  };

  const { x, y } = poses[pose] || poses.disappointed;

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{
        width: size,
        height: size,
        backgroundImage: 'url(https://balancen.app/wp-content/uploads/2026/04/0d078ce1-2500-4825-a383-7f7db4d372ea.png)',
        backgroundSize: '200% 400%',
        backgroundPosition: `${x}% ${y}%`,
        backgroundRepeat: 'no-repeat',
      }} />
      {message && (
        <p className="text-white/70 text-sm text-center italic px-4">
          {message}
        </p>
      )}
    </div>
  );
}