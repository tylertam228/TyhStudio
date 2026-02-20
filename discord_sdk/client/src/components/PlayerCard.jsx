import { motion } from 'framer-motion';

export default function PlayerCard({ player, isCurrentUser = false }) {
  // Discord 頭像 URL
  const avatarUrl = player.odavatar
    ? `https://cdn.discordapp.com/avatars/${player.oduserId}/${player.odavatar}.webp?size=64`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(player.oduserId || '0') % 5}.png`;

  return (
    <motion.div
      className={`player-card ${isCurrentUser ? 'is-current-user' : ''} ${player.odisHost ? 'is-host' : ''}`}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 頭像 */}
      <div className="player-avatar-wrapper">
        <img
          src={avatarUrl}
          alt={player.username}
          className="player-avatar"
          onError={(e) => {
            e.target.src = `https://cdn.discordapp.com/embed/avatars/0.png`;
          }}
        />
        {player.odisHost && (
          <span className="host-crown" title="房主">👑</span>
        )}
        {isCurrentUser && (
          <span className="current-user-indicator" title="這是你">✨</span>
        )}
      </div>

      {/* 名稱 */}
      <div className="player-info">
        <span className="player-name">
          {player.username || '未知玩家'}
          {isCurrentUser && <span className="you-tag">(你)</span>}
        </span>
        {player.odisHost && (
          <span className="player-role">房主</span>
        )}
      </div>

      {/* 狀態指示燈 */}
      <div className="player-status">
        <span className="status-dot online" />
      </div>
    </motion.div>
  );
}
