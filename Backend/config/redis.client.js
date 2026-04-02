const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("connect", () => console.log("✅ Redis Connected"));
redisClient.on("error", (err) => console.error("❌ Redis error:", err));

// Connect once on startup
(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;