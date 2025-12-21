import React, { useEffect, useState } from 'react';
import { referralAPI } from '../services/api';
import { useAuthStore } from '../store';

const Referrals = () => {
  const { user } = useAuthStore();
  const [referrals, setReferrals] = useState([]);

  const referralLink = `${window.location.origin}/?ref=${user?.id}`;

  useEffect(() => {
    const loadReferrals = async () => {
      try {
        const res = await referralAPI.getReferrals();
        setReferrals(res.data.data || []);
      } catch (err) {
        console.error("Failed to load referrals:", err);
      }
    };

    loadReferrals();
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert("Referral link copied!");
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-to-b from-[#0A1A2F] to-[#0D0D0D] text-white">

      {/* Header */}
      <h1 className="text-3xl font-semibold text-gold-400 mb-2">
        Summon Allies
      </h1>
      <p className="text-gray-300 mb-6">
        Invite others to join the Queen’s Quest and earn rewards.
      </p>

      {/* Referral Link */}
      <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-2xl p-5 mb-8 shadow-lg">
        <div className="text-sm text-gray-300 mb-2">Your Referral Link</div>

        <div className="bg-[#1A2A3A] p-3 rounded-xl text-sm break-all border border-[#D4A857]/20">
          {referralLink}
        </div>

        <button
          onClick={copyLink}
          className="mt-4 w-full bg-gold-400 text-black font-semibold py-3 rounded-xl"
        >
          Copy Link
        </button>
      </div>

      {/* Referral List */}
      <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-gold-400 mb-4">
          Invited Fighters
        </h2>

        {referrals.length === 0 ? (
          <div className="text-gray-400">No referrals yet.</div>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-[#1A2A3A] p-3 rounded-xl border border-[#D4A857]/20"
              >
                <div>
                  <div className="font-medium">{ref.username}</div>
                  <div className="text-xs text-gray-400">
                    Joined: {new Date(ref.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-gold-400 font-semibold">
                  +{ref.rewardPoints} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Referrals;
