import React from 'react';
import { useAuthStore } from '../store';

const Profile = () => {
  const { user } = useAuthStore();

  const displayName = user?.firstName || user?.username || "Traveler";

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-to-b from-[#0A1A2F] to-[#0D0D0D] text-white">

      {/* Header */}
      <h1 className="text-3xl font-semibold text-gold-400 mb-2">
        Your Journey
      </h1>
      <p className="text-gray-300 mb-6">
        Your progress in the Queen’s 6‑month quest.
      </p>

      {/* Profile Card */}
      <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-2xl p-6 mb-8 shadow-lg">
        <div className="flex items-center gap-4">
          <img
            src={user?.photoUrl || "/avatar-placeholder.png"}
            alt="avatar"
            className="w-20 h-20 rounded-xl object-cover border border-[#D4A857]/30"
          />

          <div>
            <div className="text-xl font-bold text-gold-400">{displayName}</div>
            <div className="text-gray-300 text-sm mt-1">
              Joined: {new Date(user?.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-xl p-4">
          <div className="text-sm text-gray-300">Total Points</div>
          <div className="text-2xl font-bold text-gold-400">{user?.totalPoints || 0}</div>
        </div>

        <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-xl p-4">
          <div className="text-sm text-gray-300">Level</div>
          <div className="text-2xl font-bold text-gold-400">{user?.currentLevel || 1}</div>
        </div>

        <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-xl p-4">
          <div className="text-sm text-gray-300">Referrals</div>
          <div className="text-2xl font-bold text-gold-400">{user?.referralCount || 0}</div>
        </div>

        <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-xl p-4">
          <div className="text-sm text-gray-300">Rank</div>
          <div className="text-2xl font-bold text-gold-400">#{user?.rank || "-"}</div>
        </div>
      </div>

      {/* Journey Progress */}
      <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-2xl p-6 mb-8 shadow-lg">
        <h2 className="text-xl font-semibold text-gold-400 mb-3">
          6‑Month Quest Progress
        </h2>

        <div className="text-gray-300 text-sm mb-4">
          You are currently on <span className="text-gold-400 font-semibold">Level {user?.currentLevel || 1}</span>  
          of the Queen’s journey to King Solomon.
        </div>

        <div className="w-full bg-[#1A2A3A] h-3 rounded-full overflow-hidden border border-[#D4A857]/20">
          <div
            className="bg-gold-400 h-full"
            style={{ width: `${(user?.currentLevel || 1) / 6 * 100}%` }}
          />
        </div>

        <div className="text-xs text-gray-400 mt-2">
          {user?.currentLevel || 1} / 6 Levels Completed
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-gold-400 mb-4">
          Achievements
        </h2>

        <ul className="space-y-3 text-gray-300 text-sm">
          <li>• Joined the Queen’s Army</li>
          <li>• Began the 6‑Month Quest</li>
          <li>• Earned your first points</li>
          <li>• Invited allies to the kingdom</li>
        </ul>
      </div>

    </div>
  );
};

export default Profile;
