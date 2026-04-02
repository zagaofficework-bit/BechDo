function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join a chat room
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });

    // Leave a chat room
    socket.on("leaveRoom", (roomId) => {
      socket.leave(roomId);
      console.log(`User left room: ${roomId}`);
    });

    // Typing indicators
    socket.on("typing", (roomId) => {
      socket.to(roomId).emit("typing");
    });

    socket.on("stopTyping", (roomId) => {
      socket.to(roomId).emit("stopTyping");
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = socketHandler;