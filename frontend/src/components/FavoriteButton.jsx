import { Bookmark } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';

export default function FavoriteButton({ postId, size = 'default' }) {
  const { isLoggedIn } = useAuth();
  const { favoritedPostIds, toggle } = useFavorites();

  if (!isLoggedIn) return null;

  const favorited = favoritedPostIds.has(postId);
  const iconSize = size === 'sm' ? 14 : 15;

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggle(postId);
  };

  return (
    <button
      className={`fav-btn ${favorited ? 'favorited' : ''} ${size === 'sm' ? 'fav-btn-sm' : ''}`}
      onClick={handleClick}
      title={favorited ? 'Remove from favorites' : 'Save to favorites'}
    >
      <Bookmark
        size={iconSize}
        fill={favorited ? 'currentColor' : 'none'}
      />
    </button>
  );
}
