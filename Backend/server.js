require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectToDB = require("./config/db");
const socketHandler = require("./socket/socket");

connectToDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
});

// Socket 
app.set("io", io);
socketHandler(io);

server.listen(3000, () => {
  console.log("Server is running on port 3000 ✅");
});