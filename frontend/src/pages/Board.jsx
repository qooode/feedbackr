import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Inbox, Loader, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import pb from '../lib/pocketbase';
import PostCard from '../components/PostCard';
import CommunitySidebar from '../components/CommunitySidebar';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = ['all', 'bug', 'feature', 'improvement'];
const PLATFORMS = ['all', 'iOS', 'iPadOS', 'macOS', 'tvOS'];
const STATUSES = ['all', 'new', 'in_review', 'processing', 'done', 'dropped', 'later', 'released'];
const SORT_OPTIONS = [
  { value: '-votes_count', label: 'Most Voted' },
  { value: '-created', label: 'Newest' },
  { value: 'created', label: 'Oldest' },
];
const PER_PAGE = 20;

export default function Board() {
  const { isLoggedIn } = useAuth();
  const [posts, setPosts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('-votes_count');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);


  // Generation counter — increments on every filter change to discard stale responses
  const fetchGenRef = useRef(0);

  // Build the PocketBase filter string from current state
  const buildFilter = useCallback(() => {
    const filters = [];
    if (category !== 'all') filters.push(`category = "${category}"`);
    if (platform !== 'all') filters.push(`platform = "${platform}"`);
    if (status !== 'all') filters.push(`status = "${status}"`);
    if (search.trim()) {
      const sanitized = search.trim().replace(/[^\w\s]/g, '').slice(0, 100);
      if (sanitized) filters.push(`(title ~ "${sanitized}" || body ~ "${sanitized}")`);
    }
    return filters.join(' && ');
  }, [category, platform, status, search]);

  // When filters or sort change → reset to page 1 and fetch fresh
  useEffect(() => {
    const gen = ++fetchGenRef.current;

    setPosts([]);
    setPage(1);
    setTotalPages(1);
    setInitialLoading(true);

    const fetchFirstPage = async () => {
      try {
        const result = await pb.collection('posts').getList(1, PER_PAGE, {
          filter: buildFilter(),
          sort,
          expand: 'author',
          requestKey: `posts-page-${gen}`,  // unique key prevents autoCancellation collisions
        });

        // Discard if a newer filter change has already started
        if (gen !== fetchGenRef.current) return;

        setPosts(result.items);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
      } catch (err) {
        if (err?.isAbort) return; // Request was intentionally cancelled
        console.error('Failed to fetch posts:', err);
      } finally {
        if (gen === fetchGenRef.current) {
          setInitialLoading(false);
        }
      }
    };

    fetchFirstPage();
  }, [category, platform, status, sort, search, buildFilter]);

  // Load more pages (triggered by infinite scroll)
  // Keep loadMore in a ref so the observer callback always calls the latest version
  const loadMoreRef = useRef(null);

  const loadMore = useCallback(async (nextPage) => {
    const gen = fetchGenRef.current; // capture current generation
    setLoadingMore(true);

    try {
      const result = await pb.collection('posts').getList(nextPage, PER_PAGE, {
        filter: buildFilter(),
        sort,
        expand: 'author',
        requestKey: `posts-page-${gen}-${nextPage}`,
      });

      // Discard if filters changed while loading
      if (gen !== fetchGenRef.current) return;

      setPosts((prev) => [...prev, ...result.items]);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (err) {
      if (err?.isAbort) return;
      console.error('Failed to load more posts:', err);
    } finally {
      if (gen === fetchGenRef.current) {
        setLoadingMore(false);
      }
    }
  }, [buildFilter, sort]);

  loadMoreRef.current = loadMore;

  // Refs so the observer callback always reads fresh values (no stale closures)
  const pageRef = useRef(page);
  const totalPagesRef = useRef(totalPages);
  const loadingMoreRef = useRef(loadingMore);
  pageRef.current = page;
  totalPagesRef.current = totalPages;
  loadingMoreRef.current = loadingMore;

  // Stable observer ref — created once and never torn down/recreated
  const observerRef = useRef(null);

  // Callback ref for the sentinel element — fires when it mounts/unmounts in the DOM
  // This solves the conditional-render timing issue: the sentinel is inside
  // {posts.length > 0 && ...} so a useEffect + useRef would miss it.
  const sentinelCallbackRef = useCallback((node) => {
    // Disconnect previous observer if any
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return; // sentinel unmounted

    const observer = new IntersectionObserver(
      (entries) => {
        const hasMore = pageRef.current < totalPagesRef.current;
        if (entries[0].isIntersecting && hasMore && !loadingMoreRef.current) {
          const nextPage = pageRef.current + 1;
          setPage(nextPage);
          loadMoreRef.current(nextPage);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    observerRef.current = observer;
  }, []); // stable — never recreated

  const hasFilters = category !== 'all' || platform !== 'all' || status !== 'all' || search.trim();
  const activeFilterCount = (category !== 'all' ? 1 : 0) + (platform !== 'all' ? 1 : 0) + (status !== 'all' ? 1 : 0);

  const clearAllFilters = () => {
    setCategory('all');
    setPlatform('all');
    setStatus('all');
    setSort('-votes_count');
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header board-header">
          <div className="board-header-top">
            <div>
              <h1 className="page-title">Feedback Board</h1>
              <p className="page-subtitle">
                Browse ideas, report bugs, and vote on what matters most.
              </p>
            </div>
          </div>
        </div>

        {/* Two-column layout: Feed + Sidebar */}
        <div className="board-layout">
          <div className="board-main">
            {/* Compact Toolbar */}
            <div className="board-toolbar">
              <div className="search-input" style={{ position: 'relative' }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted-foreground)',
                  }}
                />
                <input
                  className="input"
                  type="text"
                  placeholder="Search feedback..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '34px' }}
                />
              </div>

              <div className="board-toolbar-right">
                {/* Sort — always visible */}
                <select
                  className="input"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  style={{ width: 'auto', minWidth: '120px' }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Filters toggle */}
                <button
                  className={`board-filters-toggle ${filtersOpen ? 'active' : ''}`}
                  onClick={() => setFiltersOpen((prev) => !prev)}
                >
                  <SlidersHorizontal size={14} />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="board-filters-count">{activeFilterCount}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Filters Panel */}
            <div className={`board-filters-panel ${filtersOpen ? 'open' : ''}`}>
              <div className="board-filters-panel-inner">
                {/* Category */}
                <div className="board-filter-section">
                  <span className="board-filter-label">Category</span>
                  <div className="filter-group">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        className={`filter-btn ${category === cat ? 'active' : ''}`}
                        onClick={() => setCategory(cat)}
                      >
                        {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform */}
                <div className="board-filter-section">
                  <span className="board-filter-label">Platform</span>
                  <div className="filter-group">
                    {PLATFORMS.map((plat) => (
                      <button
                        key={plat}
                        className={`filter-btn ${platform === plat ? 'active' : ''}`}
                        onClick={() => setPlatform(plat)}
                      >
                        {plat === 'all' ? 'All' : plat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="board-filter-section">
                  <span className="board-filter-label">Status</span>
                  <div className="board-filter-status-wrap">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        className={`status-filter-btn ${status === s ? 'active' : ''}`}
                        onClick={() => setStatus(s)}
                      >
                        {s === 'all' ? 'All' : s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear all */}
                {activeFilterCount > 0 && (
                  <button className="board-clear-filters" onClick={clearAllFilters}>
                    <X size={12} />
                    Clear all filters
                  </button>
                )}
              </div>
            </div>

            {/* Active filter chips — visible when panel is closed */}
            {!filtersOpen && activeFilterCount > 0 && (
              <div className="board-active-chips">
                {category !== 'all' && (
                  <span className="board-active-chip">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                    <button onClick={() => setCategory('all')}><X size={10} /></button>
                  </span>
                )}
                {platform !== 'all' && (
                  <span className="board-active-chip">
                    {platform}
                    <button onClick={() => setPlatform('all')}><X size={10} /></button>
                  </span>
                )}
                {status !== 'all' && (
                  <span className="board-active-chip">
                    {status.replace('_', ' ')}
                    <button onClick={() => setStatus('all')}><X size={10} /></button>
                  </span>
                )}
              </div>
            )}

            {/* Posts */}
            {initialLoading ? (
              <div className="loading-page" style={{ minHeight: '40vh' }}>
                <div className="spinner" />
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Inbox size={40} strokeWidth={1.5} />
                </div>
                <h3 className="empty-state-title">No feedback yet</h3>
                <p className="empty-state-text">
                  Be the first to share your thoughts.
                </p>
                <Link to="/submit" className="btn btn-primary btn-lg">
                  <Plus size={15} />
                  Submit Feedback
                </Link>
              </div>
            ) : (
              <>
                <div className="board-posts-list">
                  {posts.map((post, index) => (
                    <div
                      key={post.id}
                      className="board-post-entrance"
                      style={{ animationDelay: `${Math.min(index * 0.04, 0.6)}s` }}
                    >
                      <PostCard post={post} />
                    </div>
                  ))}
                </div>

                {/* Infinite scroll sentinel + loading indicator */}
                <div ref={sentinelCallbackRef} className="infinite-scroll-sentinel">
                  {loadingMore && (
                    <div className="infinite-scroll-loader">
                      <Loader size={18} className="infinite-scroll-spinner" />
                      <span>Loading more…</span>
                    </div>
                  )}
                  {page >= totalPages && posts.length > PER_PAGE && (
                    <div className="infinite-scroll-end">
                      You've seen all {totalItems.toLocaleString()} submissions
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Sidebar */}
          <CommunitySidebar />
        </div>
      </div>
    </div>
  );
}
