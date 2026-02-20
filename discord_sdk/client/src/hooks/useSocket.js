import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';

let socketInstance = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const initRef = useRef(false);

  const {
    discordInfo,
    setRoomState,
    setIsHost,
    addNotification,
  } = useGameStore();

  const connect = useCallback(() => {
    if (socketInstance?.connected) return;

    const socketUrl = window.location.origin;
    
    socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Socket.io connected:', socketInstance.id);
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket.io disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket.io connection error:', err);
      setError('伺服器連接失敗');
    });

    socketInstance.on('room_update', (roomState) => {
      setRoomState(roomState);
    });

    socketInstance.on('host_status', ({ isHost }) => {
      setIsHost(isHost);
    });

    socketInstance.on('error', ({ message }) => {
      console.error('Server error:', message);
      addNotification({
        type: 'error',
        message,
      });
    });
  }, [setRoomState, setIsHost, addNotification]);

  const joinRoom = useCallback(() => {
    if (!socketInstance || !discordInfo?.channelId) return;

    socketInstance.emit('join_room', {
      channelId: discordInfo.channelId,
      userId: discordInfo.userId,
      username: discordInfo.username,
      avatar: discordInfo.avatar,
    });
  }, [discordInfo]);

  useEffect(() => {
    if (!discordInfo?.channelId || initRef.current) return;
    initRef.current = true;

    connect();
  }, [discordInfo, connect]);

  useEffect(() => {
    if (isConnected && discordInfo?.channelId) {
      joinRoom();
    }
  }, [isConnected, discordInfo, joinRoom]);

  return {
    socket: socketInstance,
    isConnected,
    error,
  };
}
