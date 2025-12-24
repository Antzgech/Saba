require('dotenv').config();
console.log("🚀 Bot is starting...");
console.log("🔑 Token exists:", !!process.env.TELEGRAM_BOT_TOKEN);
console.log("🌐 Backend URL:", process.env.BACKEND_URL);
console.log("🌐 WebApp URL:", process.env.WEBAPP_URL);

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const userTokens = {};

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const BACKEND_URL = process.env.BACKEND_URL;
const WEBAPP_URL = process.env.WEBAPP_URL;

// ======================================================
//                      /start
// ======================================================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  console.log("🔥 /start triggered by", chatId);

  await bot.sendMessage(chatId, "Welcome! Open your dashboard:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open Dashboard",
            web_app: { url: WEBAPP_URL }
          }
        ]
      ]
    }
  });
});

// ======================================================
//      Handle REAL Telegram WebApp login data
// ======================================================
bot.on("web_app_data", async (msg) => {
  const chatId = msg.chat.id;

  try {
    console.log("🔥 WebApp data received:", msg.web_app_data.data);

    const data = JSON.parse(msg.web_app_data.data);

    // Send real Telegram initData to backend
    const res = await axios.post(`${BACKEND_URL}/api/auth/telegram`, data);

    const token = res.data.data.token;
    userTokens[chatId] = token;

    await bot.sendMessage(chatId, "✅ Login successful!");
  } catch (err) {
    console.log("❌ WebApp login error:", err.response?.data || err.message);
    await bot.sendMessage(chatId, "❌ Login failed.");
  }
});

// ======================================================
//                      /profile
// ======================================================
bot.onText(/\/profile/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userTokens[chatId]}` }
    });

    const user = res.data.data.user;

    bot.sendMessage(
      chatId,
      `👤 *Your Profile*\n\n` +
      `Name: ${user.firstName || ''} ${user.lastName || ''}\n` +
      `Username: @${user.username || 'N/A'}\n` +
      `Points: ${user.totalPoints}\n` +
      `Level: ${user.currentLevel}\n` +
      `Referral Code: ${user.referralCode}`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    bot.sendMessage(chatId, "❌ Unable to fetch your profile.");
  }
});

// ======================================================
//                      /points
// ======================================================
bot.onText(/\/points/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userTokens[chatId]}` }
    });

    const points = res.data.data.user.totalPoints;

    bot.sendMessage(chatId, `🏆 You have *${points} points*!`, {
      parse_mode: "Markdown"
    });
  } catch (err) {
    bot.sendMessage(chatId, "❌ Unable to fetch your points.");
  }
});

// ======================================================
//                    /leaderboard
// ======================================================
bot.onText(/\/leaderboard/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const res = await axios.get(`${BACKEND_URL}/api/leaderboard`);

    const list = res.data.data
      .map((u, i) => `${i + 1}. ${u.firstName || ''} ${u.lastName || ''} — ${u.totalPoints} pts`)
      .join("\n");

    bot.sendMessage(chatId, `🏅 *Leaderboard*\n\n${list}`, {
      parse_mode: "Markdown"
    });
  } catch (err) {
    bot.sendMessage(chatId, "❌ Unable to load leaderboard.");
  }
});

// ======================================================
//                     /referral
// ======================================================
bot.onText(/\/referral/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userTokens[chatId]}` }
    });

    const code = res.data.data.user.referralCode;
    const link = `https://t.me/${process.env.BOT_USERNAME}?start=${code}`;

    bot.sendMessage(
      chatId,
      `🔗 *Your Referral Code:* ${code}\n\n` +
      `Share this link:\n${link}`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    bot.sendMessage(chatId, "❌ Unable to fetch your referral code.");
  }
});

console.log("🤖 Bot is running...");
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});


