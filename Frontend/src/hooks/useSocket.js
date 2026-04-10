import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

// Module-level singleton — ek hi socket instance
let globalSocket = null;
let refCount = 0;

function getSocket(token) {
  if (!globalSocket || !globalSocket.connected) {
    globalSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return globalSocket;
}

export function useSocket() {
  const token = localStorage.getItem("accessToken");
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    refCount++;
    socketRef.current = getSocket(token);

    return () => {
      refCount--;
      // Sirf tab disconnect karo jab koi component use nahi kar raha
      if (refCount === 0 && globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
    };
  }, [token]);

  return socketRef.current;
}

// Room join helper
export function joinRoom(socket, userId1, userId2) {
  if (!socket) return;
  const room = [String(userId1), String(userId2)].sort().join("_");
  socket.emit("joinRoom", room);
  return room;
}