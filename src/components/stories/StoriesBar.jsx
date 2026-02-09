import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StoryViewer from "./StoryViewer";

export default function StoriesBar({ currentUser, currentProfile }) {
  const navigate = useNavigate();
  const [viewingStories, setViewingStories] = useState(null);

  const { data: allStories = [] } = useQuery({
    queryKey: ["active-stories", currentUser?.email],
    queryFn: async () => {
      const now = new Date().toISOString();
      const stories = await base44.entities.Story.list("-created_date", 100);
      return stories.filter(s => s.expires_at > now);
    },
    enabled: !!currentUser?.email,
    refetchInterval: 60000,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["friends-stories", currentUser?.email],
    queryFn: () => base44.entities.Friend.filter({ created_by: currentUser.email }),
    enabled: !!currentUser?.email,
  });

  const friendEmails = friends.map(f => f.friend_user_id);
  const myStories = allStories.filter(s => s.user_email === currentUser?.email);
  const friendStories = allStories.filter(s => friendEmails.includes(s.user_email));

  // Group stories by user
  const groupedStories = {};
  friendStories.forEach(story => {
    if (!groupedStories[story.user_email]) {
      groupedStories[story.user_email] = [];
    }
    groupedStories[story.user_email].push(story);
  });

  const hasMyStories = myStories.length > 0;
  const hasUnviewedStories = (stories) => {
    return stories.some(s => !s.views?.includes(currentUser?.email));
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide">
        {/* Your Story */}
        <button
          onClick={() => navigate(createPageUrl('CreateStory'))}
          className="flex-shrink-0 flex flex-col items-center gap-2"
        >
          <div className={`relative w-16 h-16 rounded-full ${hasMyStories ? 'ring-2 ring-purple-500' : 'ring-2 ring-white/30'} ring-offset-2 ring-offset-slate-900`}>
            {currentProfile?.avatar_url ? (
              <img src={currentProfile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                {currentProfile?.display_name?.charAt(0) || "?"}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900">
              <Plus size={12} className="text-white" />
            </div>
          </div>
          <span className="text-white text-xs font-medium">Tu historia</span>
        </button>

        {/* Friends' Stories */}
        {Object.entries(groupedStories).map(([email, stories]) => {
          const latestStory = stories[0];
          const hasUnviewed = hasUnviewedStories(stories);
          
          return (
            <button
              key={email}
              onClick={() => setViewingStories({ email, stories })}
              className="flex-shrink-0 flex flex-col items-center gap-2"
            >
              <div className={`relative w-16 h-16 rounded-full ${hasUnviewed ? 'ring-2 ring-gradient-to-r from-purple-500 to-pink-500' : 'ring-2 ring-white/30'} ring-offset-2 ring-offset-slate-900`}>
                {latestStory.user_avatar ? (
                  <img src={latestStory.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                    {latestStory.user_name?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <span className="text-white text-xs font-medium truncate max-w-[64px]">
                {latestStory.user_name?.split(' ')[0] || email.split('@')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {viewingStories && (
        <StoryViewer
          stories={viewingStories.stories}
          currentUser={currentUser}
          onClose={() => setViewingStories(null)}
        />
      )}
    </>
  );
}