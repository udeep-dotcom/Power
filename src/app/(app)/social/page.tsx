"use client";
import TopBar from "@/components/layout/TopBar";
import { feedPosts, currentUser } from "@/lib/data";
import { getInitials } from "@/lib/utils";
import { Heart, MessageCircle, Share2, Smile, Image as ImageIcon, Plus, Megaphone, Flame } from "lucide-react";
import { useState } from "react";

type Post = typeof feedPosts[0] & { liked: boolean; likes: number };

export default function SocialPage() {
  const [posts, setPosts] = useState<Post[]>(feedPosts as Post[]);
  const [newPost, setNewPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "trending" | "announcements">("feed");

  const toggleLike = (id: string) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    setIsPosting(true);
    setTimeout(() => {
      setPosts(prev => [{
        id: `p${Date.now()}`,
        user: { name: currentUser.name, avatar: "", level: currentUser.level },
        type: "workout",
        content: newPost,
        likes: 0,
        comments: 0,
        time: "Just now",
        liked: false,
      } as Post, ...prev]);
      setNewPost("");
      setIsPosting(false);
    }, 600);
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "announcement": return <Megaphone className="w-3 h-3" />;
      case "checkin": return <Flame className="w-3 h-3" />;
      default: return null;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "announcement": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "progress": return "text-purple-400 bg-purple-400/10 border-purple-400/20";
      case "nutrition": return "text-green-400 bg-green-400/10 border-green-400/20";
      case "checkin": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      default: return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const filteredPosts = activeTab === "announcements"
    ? posts.filter(p => p.type === "announcement")
    : posts;

  return (
    <div className="animate-fade-in">
      <TopBar title="Community" />
      <div className="px-4 lg:px-6 py-5 max-w-2xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-5 bg-[#111111] border border-[#1f1f1f] rounded-xl p-1">
          {(["feed", "trending", "announcements"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab ? "bg-green-500/10 text-green-400 border border-green-500/20" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-4 mb-5">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-xs font-bold shrink-0">
              {getInitials(currentUser.name)}
            </div>
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="Share your progress, a workout, or inspire the community..."
              className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/40 resize-none"
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1f1f1f]">
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-green-400 transition-colors">
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-green-400 transition-colors">
                <Smile className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={handlePost}
              disabled={!newPost.trim() || isPosting}
              className="btn-primary px-4 py-1.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 flex items-center gap-1.5"
            >
              {isPosting ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Post
            </button>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden card-hover">
              {/* Header */}
              <div className="p-4 pb-0 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {getInitials(post.user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{post.user.name}</span>
                    {post.user.level > 0 && (
                      <span className="text-[10px] text-gray-500 bg-[#1f1f1f] px-1.5 py-0.5 rounded">Lvl {post.user.level}</span>
                    )}
                    <span className={`text-[10px] capitalize px-1.5 py-0.5 rounded border flex items-center gap-1 ${typeColor(post.type)}`}>
                      {typeIcon(post.type)}
                      {post.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{post.time}</p>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 py-3">
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">{post.content}</p>

                {/* Workout stats */}
                {'stats' in post && post.stats && (
                  <div className="flex gap-3 mt-2">
                    {Object.entries(post.stats).map(([key, val]) => (
                      <span key={key} className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] px-2.5 py-1 rounded-full text-gray-400">
                        {val}
                      </span>
                    ))}
                  </div>
                )}

                {/* Streak badge */}
                {'streak' in post && post.streak && (
                  <div className="inline-flex items-center gap-1.5 mt-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 text-xs font-semibold text-orange-400">
                    🔥 {post.streak}-day streak
                  </div>
                )}
              </div>

              {/* Mock image placeholder for posts with images */}
              {'image' in post && post.image && (
                <div className="mx-4 mb-3 h-48 bg-gradient-to-br from-[#1a1a1a] to-[#151515] rounded-xl border border-[#2a2a2a] flex items-center justify-center text-gray-600">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}

              {/* Actions */}
              <div className="px-4 pb-4 flex items-center gap-4 border-t border-[#1f1f1f] pt-3">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1.5 text-sm transition-all ${post.liked ? "text-red-400" : "text-gray-500 hover:text-red-400"}`}
                >
                  <Heart className={`w-4 h-4 ${post.liked ? "fill-current" : ""} transition-transform active:scale-125`} />
                  {post.likes}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-400 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  {post.comments}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-400 transition-colors ml-auto">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
