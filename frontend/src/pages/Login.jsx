import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Trophy } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();

  // -----------------------------
  // FIX 1: Define this BEFORE useEffect
  // -----------------------------
 const handleTelegramLogin = async () => {
  try {
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe?.user;

    if (!user) {
      console.error("No Telegram user data found");
      return;
    }

   const data = {
  telegramId: user.id.toString(),
  username: user.username || "",
  firstName: user.first_name || "",
  lastName: user.last_name || "",
  photoUrl: user.photo_url || "",
  authData: JSON.stringify(tg.initDataUnsafe),  // FIXED
  referralCode: new URLSearchParams(window.location.search).get("ref") || ""
};


    await login(data);
    navigate("/dashboard");
  } catch (error) {
    console.error("Login error:", error);
  }
};

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Telegram initialization + auto-login
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      const initData = tg.initDataUnsafe;
      if (initData?.user) {
        handleTelegramLogin();
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="p-6 bg-primary-600/20 rounded-3xl">
            <Trophy className="w-16 h-16 text-primary-500" />
          </div>
        </div>

        <h1 className="text-5xl font-display font-bold mb-4 gradient-text">
          Telegram Rewards
        </h1>

        <p className="text-xl text-gray-400 mb-8">
          Play games, earn points, and win real cash prizes!
        </p>

        <div className="card text-left mb-8">
          <h3 className="font-semibold mb-3">How it works:</h3>
          <ul className="space-y-2 text-gray-400">
            <li>✓ Play daily 10-minute games</li>
            <li>✓ Complete social media tasks</li>
            <li>✓ Invite friends to earn bonuses</li>
            <li>✓ Compete on the leaderboard</li>
            <li>✓ Top 10 players win prizes every 15 days!</li>
          </ul>
        </div>

        <button
          onClick={handleTelegramLogin}
          className="btn-primary w-full text-lg"
        >
          Login with Telegram
        </button>

        <p className="text-sm text-gray-500 mt-6">
          Open this app from your Telegram bot to get started
        </p>
      </div>
    </div>
  );
};

export default Login;
