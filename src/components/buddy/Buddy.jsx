import React from 'react';

export default function Buddy({ pose = 'disappointed', size = 120, message }) {
  const poses = {
    celebrating:  { col: 0, row: 0 },
    disappointed: { col: 1, row: 0 },
    competitive:  { col: 0, row: 1 },
    friendly:     { col: 1, row: 1 },
    proud:        { col: 0, row: 2 },
    waiting:      { col: 1, row: 2 },
  };

  const { col, row } = poses[pose] || poses.disappointed;

  const cols = 2;
  const rows = 4;
  const bgWidth = size * cols;
  const bgHeight = size * rows * 1.15;
  const bgX = -(col * size);
  const bgY = -(row * size);

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{
        width: size,
        height: size,
        backgroundImage: 'url(https://balancen.app/wp-content/uploads/2026/04/0d078ce1-2500-4825-a383-7f7db4d372ea.png)',
        backgroundSize: `${bgWidth}px ${bgHeight}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
        border: 'none',
        outline: 'none',
      }} />
      {message && (
        <p className="text-white/70 text-sm text-center italic px-4">
          {message}
        </p>
      )}
    </div>
  );
}