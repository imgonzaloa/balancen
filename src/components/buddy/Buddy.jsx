import React from 'react';

const BUDDY_IMAGES = {
  disappointed: "https://balancen.app/wp-content/uploads/2026/04/d7d8d570-d50d-4a67-a29c-0d462cea4a45.png",
  celebrating: "https://balancen.app/wp-content/uploads/2026/04/0d078ce1-2500-4825-a383-7f7db4d372ea.png",
  competitive: "https://balancen.app/wp-content/uploads/2026/04/0d078ce1-2500-4825-a383-7f7db4d372ea.png",
  friendly: "https://balancen.app/wp-content/uploads/2026/04/0d078ce1-2500-4825-a383-7f7db4d372ea.png",
};

export default function Buddy({ pose = 'disappointed', size = 120, message }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={BUDDY_IMAGES[pose] || BUDDY_IMAGES.disappointed}
        alt="Buddy"
        style={{ width: size, height: size, objectFit: 'contain', mixBlendMode: 'multiply' }}
      />
      {message && (
        <p className="text-white/70 text-sm text-center italic px-4">
          {message}
        </p>
      )}
    </div>
  );
}