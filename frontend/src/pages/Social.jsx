import React, { useEffect, useState } from 'react';
import { socialAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Social = () => {
  const [channels, setChannels] = useState([]);
  const [status, setStatus] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await socialAPI.getChannels();
        setChannels(res.data.data || []);

        const statusRes = await socialAPI.getStatus();
        setStatus(statusRes.data.data || {});
      } catch (err) {
        console.error("Failed to load social tasks:", err);
      }
    };

    loadData();
  }, []);

  const verify = async (platform) => {
    try {
      await socialAPI.verifySubscription({ platform });
      setStatus(prev => ({ ...prev, [platform]: true }));
    } catch (err) {
      console.error("Verification failed:", err);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-to-b from-[#0A1A2F] to-[#0D0D0D] text-white">

      {/* Header */}
      <h1 className="text-3xl font-semibold text-gold-400 mb-2">
        Social Quests
      </h1>
      <p className="text-gray-300 mb-6">
        Join channels to earn the Queen’s favor.
      </p>

      {/* Channel List */}
      <div className="space-y-4">
        {channels.length === 0 && (
          <div className="text-gray-400">Loading social quests...</div>
        )}

        {channels.map(channel => (
          <div
            key={channel.platform}
            className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-2xl p-5 shadow-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-semibold text-gold-400">
                  {channel.title}
                </div>
                <div className="text-gray-300 text-sm mt-1">
                  {channel.description}
                </div>
                <div className="text-gold-400 text-sm mt-2">
                  +{channel.rewardPoints} points
                </div>
              </div>

              <div>
                {status[channel.platform] ? (
                  <div className="text-green-400 font-semibold">
                    Completed
                  </div>
                ) : (
                  <button
                    onClick={() => verify(channel.platform)}
                    className="bg-gold-400 text-black font-semibold px-4 py-2 rounded-xl"
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="mt-10 text-center">
        <Link
          to="/dashboard"
          className="text-gold-400 underline text-sm"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Social;
