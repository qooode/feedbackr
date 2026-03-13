import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import pb from '../lib/pocketbase';

export default function VoteButton({ post, size = 'default' }) {
  const { user, isLoggedIn } = useAuth();
  const [voted, setVoted] = useState(false);
  const [count, setCount] = useState(post.votes_count || 0);
  const [voteId, setVoteId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if user already voted
  useEffect(() => {
    if (!user || !post.id) return;

    const checkVote = async () => {
      try {
        const records = await pb.collection('votes').getList(1, 1, {
          filter: `post = "${post.id}" && user = "${user.id}"`,
        });
        if (records.items.length > 0) {
          setVoted(true);
          setVoteId(records.items[0].id);
        }
      } catch (err) {
        // Ignore errors
      }
    };
    checkVote();
  }, [user, post.id]);

  const handleVote = async (e) => {
    e.stopPropagation(); // Prevent card click
    if (!isLoggedIn || loading) return;

    setLoading(true);
    try {
      if (voted && voteId) {
        // Remove vote
        await pb.collection('votes').delete(voteId);
        setVoted(false);
        setVoteId(null);
        setCount((c) => Math.max(0, c - 1));
      } else {
        // Add vote
        const record = await pb.collection('votes').create({
          post: post.id,
          user: user.id,
        });
        setVoted(true);
        setVoteId(record.id);
        setCount((c) => c + 1);
      }
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`vote-btn ${voted ? 'voted' : ''}`}
      onClick={handleVote}
      disabled={!isLoggedIn || loading}
      title={isLoggedIn ? (voted ? 'Remove vote' : 'Upvote') : 'Sign in to vote'}
    >
      <ChevronUp size={size === 'small' ? 14 : 16} />
      <span>{count}</span>
    </button>
  );
}
