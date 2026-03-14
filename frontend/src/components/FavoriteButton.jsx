import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import pb from '../lib/pocketbase';

export default function FavoriteButton({ postId, size = 'default' }) {
  const { user, isLoggedIn } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [favId, setFavId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !postId) return;

    const checkFavorite = async () => {
      try {
        const records = await pb.collection('favorites').getList(1, 1, {
          filter: `post = "${postId}" && user = "${user.id}"`,
        });
        if (records.items.length > 0) {
          setFavorited(true);
          setFavId(records.items[0].id);
        }
      } catch {
        // favorites collection may not exist yet
      }
    };
    checkFavorite();
  }, [user, postId]);

  const handleToggle = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isLoggedIn || loading) return;

    setLoading(true);
    try {
      if (favorited && favId) {
        await pb.collection('favorites').delete(favId);
        setFavorited(false);
        setFavId(null);
      } else {
        const record = await pb.collection('favorites').create({
          post: postId,
        });
        setFavorited(true);
        setFavId(record.id);
      }
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  const iconSize = size === 'sm' ? 14 : 15;

  return (
    <button
      className={`fav-btn ${favorited ? 'favorited' : ''} ${size === 'sm' ? 'fav-btn-sm' : ''}`}
      onClick={handleToggle}
      disabled={loading}
      title={favorited ? 'Remove from favorites' : 'Save to favorites'}
    >
      <Bookmark
        size={iconSize}
        fill={favorited ? 'currentColor' : 'none'}
      />
    </button>
  );
}
