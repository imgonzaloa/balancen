import { BUDDY } from './BuddyImages';
export default function Buddy({ pose = 'celebrating', size = 120, message }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <img src={BUDDY[pose]} alt="Buddy" 
        style={{ width: size, height: size, objectFit: 'contain' }} />
      {message && (
        <p className="text-white/70 text-sm text-center italic px-4">{message}</p>
      )}
    </div>
  );
}