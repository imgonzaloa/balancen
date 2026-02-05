import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Flame, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FriendDetailModal from "./FriendDetailModal";

export default function FriendsList({ currentUser }) {
  const [selectedFriend, setSelectedFriend] = useState(null);

  const { data: friends = [] } = useQuery({
    queryKey: ["friends", currentUser?.email],
    queryFn: async () => {
      return base44.entities.Friend.filter({ created_by: currentUser?.email }, "-fire_count");
    },
    enabled: !!currentUser?.email,
  });

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
          {friends.map((friend, idx) => (
            <motion.button
              key={friend.id}
              onClick={() => setSelectedFriend(friend)}
              className="flex-shrink-0 flex flex-col items-center w-[72px] focus:outline-none overflow-visible"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative mb-2 w-16 h-16 overflow-visible">
                {/* Avatar - Perfect Circle */}
                {friend.avatar_url ? (
                  <img
                    src={friend.avatar_url}
                    alt={friend.display_name}
                    className="absolute inset-0 w-full h-full rounded-full object-cover border-2 border-white/30 shadow-lg"
                    style={{ clipPath: 'circle(50%)' }}
                  />
                ) : (
                  <div 
                    className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xl font-bold border-2 border-white/30 shadow-lg"
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
              <p className="text-xs font-medium text-white text-center leading-tight line-clamp-2 w-full">
                {friend.display_name}
              </p>
            </motion.button>
          ))}

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
      </div>

      {/* Friend Detail Modal */}
      <FriendDetailModal 
        friend={selectedFriend} 
        onClose={() => setSelectedFriend(null)} 
      />
    </>
  );
}