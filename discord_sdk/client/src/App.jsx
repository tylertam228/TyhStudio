import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiscordSdk } from './hooks/useDiscordSdk';
import { useSocket } from './hooks/useSocket';
import { useGameStore } from './store/gameStore';
import { setAccessToken } from './utils/api';
import Portal from './components/portal/Portal';
import IQApp from './components/iq/IQApp';
import Lobby from './components/Lobby';
import LoadingScreen from './components/LoadingScreen';

const VIEWS = { PORTAL: 'portal', IQ: 'iq', LOBBY: 'lobby' };

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('正在連接 Discord...');
  const [currentView, setCurrentView] = useState(VIEWS.PORTAL);

  const { discordSdk, auth, isReady, error: discordError } = useDiscordSdk();
  const { isConnected, error: socketError } = useSocket();
  const { roomState, isHost, discordInfo } = useGameStore();

  useEffect(() => {
    if (discordError) {
      setLoadingMessage(`Discord 錯誤: ${discordError}`);
      return;
    }

    if (!isReady) {
      setLoadingMessage('正在連接 Discord...');
      return;
    }

    if (!isConnected) {
      setLoadingMessage('正在連接伺服器...');
      return;
    }

    if (discordInfo?.accessToken) {
      setAccessToken(discordInfo.accessToken);
    }

    setIsLoading(false);
  }, [isReady, isConnected, discordError, discordInfo]);

  if (isLoading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return (
    <div className="app-container">
      <div className="background-effects">
        <div className="gradient-orb gradient-orb-1" />
        <div className="gradient-orb gradient-orb-2" />
        <div className="gradient-orb gradient-orb-3" />
        <div className="grid-overlay" />
      </div>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {currentView === VIEWS.PORTAL && (
            <motion.div
              key="portal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Portal
                userId={discordInfo?.userId}
                onSelectIQ={() => setCurrentView(VIEWS.IQ)}
              />
            </motion.div>
          )}

          {currentView === VIEWS.IQ && (
            <motion.div
              key="iq"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <IQApp
                userId={discordInfo?.userId}
                onBack={() => setCurrentView(VIEWS.PORTAL)}
              />
            </motion.div>
          )}

          {currentView === VIEWS.LOBBY && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Lobby />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {(socketError || discordError) && (
          <motion.div
            className="error-toast"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            ⚠️ {socketError || discordError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
