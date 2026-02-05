import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Flame, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FriendDetailModal from "./FriendDetailModal";

export default function FriendsList({ currentUser, profile }) {
  const [selectedFriend, setSelectedFriend] = useState(null);

  const { data: friends = [] } = useQuery({
    queryKey: ["friends", currentUser?.email],
    queryFn: async () => {
      return base44.entities.Friend.filter({ created_by: currentUser?.email }, "-fire_count");
    },
    enabled: !!currentUser?.email,
  });



  // Find top friend
  const topFriend = friends.length > 0 ? friends.reduce((max, f) => f.fire_count > max.fire_count ? f : max, friends[0]) : null;
  
  // Current user fire count
  const userFireCount = profile?.fire_total || 0;
  
  // Sort friends by fire count descending
  const sortedFriends = [...friends].sort((a, b) => b.fire_count - a.fire_count);
  
  // Find next user to pass (first user above current user)
  const nextUser = sortedFriends.find(f => f.fire_count > userFireCount);
  
  // Calculate differences
  const differenceToNext = nextUser ? nextUser.fire_count - userFireCount : 0;
  const differenceToLeader = topFriend ? topFriend.fire_count - userFireCount : 0;
  const isUserLeading = userFireCount > 0 && (!topFriend || userFireCount >= topFriend.fire_count);

  return (
    <>
      <div className="mb-6 overflow-visible">
        <div 
          className="flex items-start gap-3 overflow-x-auto pb-3" 
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <style>{`
            div::-webkit-scrollbar { display: none; }
          `}</style>

          {/* Friends Repeater */}
          {friends.map((friend, idx) => {
            const isTopUser = topFriend && friend.id === topFriend.id;
            return (
              <motion.button
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className="flex-shrink-0 flex flex-col items-center w-[72px] focus:outline-none overflow-visible"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative mb-2 w-16 h-16">
                  {/* Avatar - Perfect Circle */}
                  {friend.avatar_url ? (
                    <img
                      src={friend.avatar_url}
                      alt={friend.display_name}
                      className={`w-full h-full rounded-full object-cover ${isTopUser ? 'border-3 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]' : 'border-2 border-white/30 shadow-lg'}`}
                      style={{ clipPath: 'circle(50%)' }}
                    />
                  ) : (
                    <div 
                      className={`w-full h-full rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xl font-bold ${isTopUser ? 'border-3 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]' : 'border-2 border-white/30 shadow-lg'}`}
                      style={{ clipPath: 'circle(50%)' }}
                    >
                      {friend.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                {/* Fire Badge */}
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-2 py-0.5 shadow-lg border-2 border-slate-900 flex items-center gap-1 z-10">
                  <Flame size={12} className="text-white" fill="currentColor" />
                  <span className="text-xs font-bold text-white">{friend.fire_count}</span>
                </div>
              </div>

              {/* Name */}
              <p className={`text-xs font-medium text-center leading-tight line-clamp-2 w-full ${isTopUser ? 'text-amber-300 font-bold' : 'text-white'}`}>
                {friend.display_name}
              </p>
            </motion.button>
          );
        })}

          {/* Invite Button */}
          <Link
            to={createPageUrl("Friends")}
            className="flex-shrink-0 flex flex-col items-center w-[72px]"
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border-2 border-dashed border-white/30 flex items-center justify-center mb-2 hover:bg-white/20 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={24} className="text-white/60" />
            </motion.div>
            <p className="text-xs font-medium text-white/60 text-center">Invite</p>
          </Link>
        </div>

        {/* Dynamic Comparison Text */}
        {topFriend && (
          <div className="mt-2 px-5 space-y-1">
            <motion.p
              className="text-sm text-teal-200 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              🔥 {topFriend.display_name} is leading today with {topFriend.fire_count} fire
            </motion.p>
            
            {/* Personalized Progress */}
            <motion.p
              className="text-xs text-teal-300/80 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {isUserLeading ? (
                "You are leading. Keep your streak alive 🔥"
              ) : nextUser && differenceToNext > 0 ? (
                `You need +${differenceToNext} fire to pass ${nextUser.display_name}`
              ) : differenceToLeader > 0 ? (
                `You are ${differenceToLeader} behind the leader`
              ) : null}
            </motion.p>
          </div>
        )}
      </div>

      {/* Friend Detail Modal */}
      <FriendDetailModal 
        friend={selectedFriend} 
        onClose={() => setSelectedFriend(null)} 
      />
    </>
  );
}