import { useState, useEffect, useCallback, useRef } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import { useGameStore } from '../store/gameStore';

let discordSdkInstance = null;
let authData = null;

export function useDiscordSdk() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);
  const initRef = useRef(false);

  const { setDiscordInfo } = useGameStore();

  const setupDiscordSdk = useCallback(async () => {
    if (initRef.current) return;
    initRef.current = true;

    try {
      // 建立 Discord SDK 實例
      discordSdkInstance = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
      
      // 等待 SDK 準備就緒
      await discordSdkInstance.ready();
      console.log('✅ Discord SDK 已就緒');

      // 請求授權
      const { code } = await discordSdkInstance.commands.authorize({
        client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
        response_type: 'code',
        state: '',
        prompt: 'none',
        scope: ['identify', 'guilds'],
      });

      // 交換 Token
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Token 交換失敗');
      }

      const { access_token } = await response.json();

      // 進行身份驗證
      authData = await discordSdkInstance.commands.authenticate({
        access_token,
      });

      if (!authData) {
        throw new Error('Discord 身份驗證失敗');
      }

      console.log('✅ Discord 身份驗證成功:', authData.user.username);

      // 獲取頻道資訊
      let channelName = '未知頻道';
      if (discordSdkInstance.channelId && discordSdkInstance.guildId) {
        try {
          const channel = await discordSdkInstance.commands.getChannel({
            channel_id: discordSdkInstance.channelId,
          });
          channelName = channel.name || channelName;
          setChannelInfo(channel);
        } catch (e) {
          console.warn('無法獲取頻道資訊:', e);
        }
      }

      // 存儲到全域狀態
      setDiscordInfo({
        userId: authData.user.id,
        username: authData.user.username,
        avatar: authData.user.avatar,
        channelId: discordSdkInstance.channelId,
        guildId: discordSdkInstance.guildId,
        channelName,
        accessToken: access_token,
      });

      setIsReady(true);
    } catch (err) {
      console.error('Discord SDK 初始化失敗:', err);
      setError(err.message || 'Discord 連接失敗');
    }
  }, [setDiscordInfo]);

  useEffect(() => {
    setupDiscordSdk();
  }, [setupDiscordSdk]);

  return {
    discordSdk: discordSdkInstance,
    auth: authData,
    isReady,
    error,
    channelInfo,
  };
}
