const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();

const SECRET = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;

// Helper: verify Telegram hash
function checkTelegramAuth(data) {
  const { hash, ...rest } = data;

  const sorted = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join("\n");

  const secretKey = crypto
    .createHash("sha256")
    .update(SECRET)
    .digest();

  const checkHash = crypto
    .createHmac("sha256", secretKey)
    .update(sorted)
    .digest("hex");

  return checkHash === hash;
}

router.post("/telegram", async (req, res) => {
  try {
    const data = req.body;

    // 1. Validate Telegram signature
    if (!checkTelegramAuth(data)) {
      return res.status(401).json({
        success: false,
        message: "Invalid Telegram login signature"
      });
    }

    const telegramUser = data.user;

    // 2. Extract user info
    const telegramId = telegramUser.id;
    const username = telegramUser.username || `user${telegramId}`;
    const firstName = telegramUser.first_name || "";
    const lastName = telegramUser.last_name || "";
    const photoUrl = telegramUser.photo_url || "";

    // 3. Save or update user in DB
    // Replace this with your DB logic
    const user = await User.findOneAndUpdate(
      { telegramId },
      {
        telegramId,
        username,
        firstName,
        lastName,
        photoUrl
      },
      { upsert: true, new: true }
    );

    // 4. Create JWT token
    const token = jwt.sign(
      { id: user._id, telegramId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      data: {
        token,
        user
      }
    });
  } catch (err) {
    console.error("Telegram auth error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
