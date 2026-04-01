import React from 'react';

export default function Buddy({ pose = 'celebrating', size = 120, message }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src="https://balancen.app/wp-content/uploads/2026/04/0d078ce1-2500-4825-a383-7f7db4d372ea.png"
        alt="Buddy"
        style={{ width: size, height: 'auto', maxWidth: size }}
      />
      {message && (
        <p className="text-white/70 text-sm text-center italic px-4">
          {message}
        </p>
      )}
    </div>
  );
}