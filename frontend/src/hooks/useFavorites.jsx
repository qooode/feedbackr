import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import pb from '../lib/pocketbase';

const FavoritesContext = createContext({
  favoritedPostIds: new Set(),
  favIdMap: {},            // postId -> favoriteRecordId (for deletion)
  toggle: () => {},
  loading: false,
});

export function FavoritesProvider({ children }) {
  const { user, isLoggedIn } = useAuth();
  const [favoritedPostIds, setFavoritedPostIds] = useState(new Set());
  const [favIdMap, setFavIdMap] = useState({});       // postId -> fav record id
  const [loading, setLoading] = useState(false);

  // Fetch all favorites ONCE on login
  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await pb.collection('favorites').getList(1, 200, {
        filter: `user = "${user.id}"`,
        fields: 'id,post',               // minimal — only need IDs
      });
      const ids = new Set();
      const map = {};
      for (const fav of result.items) {
        ids.add(fav.post);
        map[fav.post] = fav.id;
      }
      setFavoritedPostIds(ids);
      setFavIdMap(map);
    } catch {
      // Collection may not exist yet — no-op
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isLoggedIn) fetchAll();
    else {
      setFavoritedPostIds(new Set());
      setFavIdMap({});
    }
  }, [isLoggedIn, fetchAll]);

  const toggle = useCallback(async (postId) => {
    if (!user) return;
    const isFav = favoritedPostIds.has(postId);

    // Optimistic update
    setFavoritedPostIds(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(postId);
      else next.add(postId);
      return next;
    });

    try {
      if (isFav && favIdMap[postId]) {
        await pb.collection('favorites').delete(favIdMap[postId]);
        setFavIdMap(prev => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
      } else {
        const record = await pb.collection('favorites').create({ post: postId });
        setFavIdMap(prev => ({ ...prev, [postId]: record.id }));
      }
    } catch (err) {
      console.error('Favorite toggle failed:', err);
      // Revert optimistic update
      setFavoritedPostIds(prev => {
        const next = new Set(prev);
        if (isFav) next.add(postId);
        else next.delete(postId);
        return next;
      });
    }
  }, [user, favoritedPostIds, favIdMap]);

  return (
    <FavoritesContext.Provider value={{ favoritedPostIds, favIdMap, toggle, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
