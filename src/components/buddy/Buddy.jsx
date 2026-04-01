import React from 'react';

const BUDDY_URL = "https://balancen.app/wp-content/uploads/2026/04/0d078ce1-2500-4825-a383-7f7db4d372ea.png";

const POSES = {
  celebrating:  { col: 0, row: 0 },
  disappointed: { col: 1, row: 0 },
  competitive:  { col: 0, row: 1 },
  friendly:     { col: 1, row: 1 },
  proud:        { col: 0, row: 2 },
  waiting:      { col: 1, row: 2 },
};

export default function Buddy({ pose = 'celebrating', size = 120, message }) {
  console.log('Buddy component rendered', pose);
  const { col, row } = POSES[pose] || POSES.celebrating;
  const bgSize = size * 2;
  const bgX = -(col * size);
  const bgY = -(row * size);

  return (
    <div className="flex flex-col items-center gap-3">
      <div style={{
        width: size,
        height: size,
        backgroundImage: `url(${BUDDY_URL})`,
        backgroundSize: `${bgSize}px ${bgSize * 2}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
      }} />
      {message && (
        <p className="text-white/70 text-sm text-center italic px-4">
          {message}
        </p>
      )}
    </div>
  );
}