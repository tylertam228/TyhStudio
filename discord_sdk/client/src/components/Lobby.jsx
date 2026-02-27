import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import PlayerCard from './PlayerCard';
import logo from '../assets/Tiger228_code.jpg';

export default function Lobby() {
  const { roomState, isHost, discordInfo } = useGameStore();

  const players = roomState?.players || [];

  return (
    <div className="lobby-container">
      <header className="lobby-header">
        <motion.div
          className="lobby-title-group"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="lobby-title">
            <img src={logo} alt="TYH Studio" className="title-logo" />
            TYH Studio
          </h1>
          <p className="lobby-subtitle">
            頻道：{discordInfo?.channelName || '未知'}
          </p>
        </motion.div>

        {isHost && (
          <motion.div
            className="host-badge"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            👑 你是房主
          </motion.div>
        )}
      </header>

      <div className="lobby-content">
        <motion.section
          className="players-section"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="section-header">
            <h2>
              <span className="section-icon">👥</span>
              玩家列表
            </h2>
            <span className="player-count">{players.length} 人在線</span>
          </div>

          <div className="players-grid">
            {players.map((player, index) => (
              <motion.div
                key={player.oduserId || index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <PlayerCard
                  player={player}
                  isCurrentUser={player.oduserId === discordInfo?.userId}
                />
              </motion.div>
            ))}
          </div>

          {players.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">🌙</span>
              <p>等待玩家加入...</p>
            </div>
          )}
        </motion.section>

        <motion.section
          className="waiting-section"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="waiting-content">
            <motion.div
              className="waiting-icon"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              🚧
            </motion.div>
            <h3>遊戲開發中</h3>
            <p>新遊戲即將推出，敬請期待！</p>
          </div>
        </motion.section>
      </div>

      <footer className="lobby-footer">
        <div className="footer-info">
          <span className="info-item">
            🔗 房間 ID: {discordInfo?.channelId?.slice(-6) || '---'}
          </span>
          <span className="info-item">
            🌐 {isHost ? '你是房主' : '等待中'}
          </span>
        </div>
      </footer>
    </div>
  );
}
