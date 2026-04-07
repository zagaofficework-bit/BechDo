const express      = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app          = express();
const { startExpirySuperSellerJob } = require("./jobs/expireSuperSellerWindow.job");

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// Start cron jobs
startExpirySuperSellerJob();

// Import route handlers
const authRouter         = require("./routes/auth.routes");
const productRouter      = require("./routes/product.routes");
const subscriptionRouter = require("./routes/subscription.routes");
const adminRouter        = require("./routes/admin.routes");
const buysellRouter      = require("./routes/buysell.routes");
const messageRouter      = require("./routes/message.routes");
const profileRouter      = require("./routes/profile.routes");
const wishlistRouter     = require("./routes/wishlist.routes");
const cartRouter         = require("./routes/cart.routes");
const deviceSellRouter   = require("./routes/deviceSell.routes");
const locationRouter     = require("./routes/location.routes");

// API routes
app.use("/api/auth",          authRouter);
app.use("/api/products",      productRouter);
app.use("/api/subscriptions", subscriptionRouter);
app.use("/api/admin",         adminRouter);
app.use("/api/orders",        buysellRouter);
app.use("/api/messages",      messageRouter);
app.use("/api/profile",       profileRouter);
app.use("/api/wishlist",      wishlistRouter);
app.use("/api/cart",          cartRouter);
app.use("/api/device-sell",   deviceSellRouter);
app.use("/api/location",      locationRouter);


module.exports = app;