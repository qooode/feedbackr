import { useState } from 'react';
import pb from '../lib/pocketbase';

/**
 * UserAvatar — shows the user's profile picture (from PocketBase file storage)
 * or falls back to a letter-initial avatar.
 *
 * Props:
 *   user     - PocketBase user record (needs id, collectionId/collectionName, avatar, name/email)
 *   size     - CSS size string (default: '28px')
 *   fontSize - fallback letter font size (default: derived from size)
 */
export default function UserAvatar({ user, size = '28px', fontSize }) {
  const [imgError, setImgError] = useState(false);

  const sizeNum = parseInt(size, 10);
  const computedFontSize = fontSize || `${Math.max(Math.round(sizeNum * 0.4), 9)}px`;

  // Try to get the avatar file URL from PocketBase
  const avatarUrl = user?.avatar && !imgError
    ? pb.files.getURL(user, user.avatar, { thumb: `${sizeNum * 2}x${sizeNum * 2}` })
    : null;

  const initial = (user?.name || user?.email || '?')[0].toUpperCase();

  if (avatarUrl) {
    return (
      <img
        className="user-avatar"
        src={avatarUrl}
        alt={user?.name || 'User'}
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--radius-md)',
          objectFit: 'cover',
          border: '1px solid var(--border)',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      className="navbar-avatar"
      style={{
        width: size,
        height: size,
        fontSize: computedFontSize,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}
