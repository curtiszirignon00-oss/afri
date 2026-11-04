import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Send, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authFetch, API_BASE_URL } from '../config/api';
import toast from 'react-hot-toast';
import { toUserMessage } from '../lib/userFacingError';

type Comment = {
  id: string;
  text: string;
  created_at: string;
  // Peut manquer sur d'anciens documents (utilisateur supprimé, champ absent)
  user?: { id: string; name?: string | null; lastname?: string | null } | null;
};

function getInitials(name?: string | null, lastname?: string | null): string {
  return `${(name ?? '').charAt(0)}${(lastname ?? '').charAt(0)}`.toUpperCase() || '?';
}

function authorName(c: Comment): string {
  const full = `${c.user?.name ?? ''} ${c.user?.lastname ?? ''}`.trim();
  return full || 'Utilisateur';
}

// Erreur HTTP → message lisible (401 = session expirée)
const httpError = (res: Response) => Object.assign(new Error(), { status: res.status });

function relTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'À l\'instant';
  if (diff < 60) return `Il y a ${diff} min`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function ArticleInteractions({ articleId }: { articleId: string }) {
  const { isLoggedIn, userProfile } = useAuth();

  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  // Fetch like state on mount — authFetch (Bearer) : sur iOS le cookie cross-site est
  // bloqué, sans token « liked » restait faux et un tap retirait le like au lieu de l'ajouter.
  // Rechargé quand la session est restaurée.
  useEffect(() => {
    authFetch(`${API_BASE_URL}/articles/${encodeURIComponent(articleId)}/likes`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setLikeCount(data.count);
          setLiked(data.liked);
        }
      })
      .catch(() => {});
  }, [articleId, userProfile?.id]);

  const fetchComments = useCallback(() => {
    authFetch(`${API_BASE_URL}/articles/${encodeURIComponent(articleId)}/comments`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Comment[]) => {
        setComments(Array.isArray(data) ? data : []);
        setCommentsLoaded(true);
      })
      .catch(() => { setCommentsLoaded(true); });
  }, [articleId]);

  const handleToggleLike = async () => {
    if (!isLoggedIn || likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/articles/${encodeURIComponent(articleId)}/like`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.count);
      } else {
        throw httpError(res);
      }
    } catch (err) {
      toast.error(toUserMessage(err, 'Votre « j’aime » n’a pas pu être enregistré. Réessayez.'));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleToggleComments = () => {
    if (!commentsOpen && !commentsLoaded) fetchComments();
    setCommentsOpen(v => !v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/articles/${encodeURIComponent(articleId)}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: commentText.trim() }),
        },
      );
      if (res.ok) {
        const newComment: Comment = await res.json();
        setComments(prev => [...prev, newComment]);
        setCommentText('');
      } else {
        throw httpError(res);
      }
    } catch (err) {
      // Avant : échec silencieux → « le bouton commenter ne marche pas »
      toast.error(toUserMessage(err, 'Votre commentaire n’a pas pu être publié. Réessayez.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await authFetch(
        `${API_BASE_URL}/articles/${encodeURIComponent(articleId)}/comments/${commentId}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      } else {
        throw httpError(res);
      }
    } catch (err) {
      toast.error(toUserMessage(err, 'Le commentaire n’a pas pu être supprimé. Réessayez.'));
    }
  };

  return (
    <div className="border-t border-slate-100 pt-4 mt-6">
      {/* Like + comment count row */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleToggleLike}
          disabled={!isLoggedIn || likeLoading}
          title={isLoggedIn ? (liked ? 'Retirer le like' : 'Liker') : 'Connectez-vous pour liker'}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors rounded-full px-3 py-1.5 border
            ${liked
              ? 'text-rose-500 border-rose-200 bg-rose-50'
              : 'text-slate-500 border-slate-200 hover:border-rose-200 hover:text-rose-400 bg-white'}
            ${!isLoggedIn ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <Heart size={14} className={liked ? 'fill-rose-500' : ''} />
          <span>{likeCount}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#00D4A8] transition-colors rounded-full px-3 py-1.5 border border-slate-200 hover:border-[#00D4A8]/40 bg-white"
        >
          <MessageCircle size={14} />
          <span>{comments.length > 0 || commentsLoaded ? comments.length : '...'}</span>
          {commentsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Comments section */}
      {commentsOpen && (
        <div className="mt-4 space-y-3">
          {/* Comment list */}
          {comments.length === 0 && commentsLoaded && (
            <p className="text-xs text-slate-400 italic text-center py-3">
              Aucun commentaire pour l'instant. Soyez le premier !
            </p>
          )}
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-2.5">
              <div className="shrink-0 w-7 h-7 rounded-full bg-[#00D4A8]/15 flex items-center justify-center text-[10px] font-bold text-[#00D4A8]">
                {getInitials(comment.user?.name, comment.user?.lastname)}
              </div>
              <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 min-w-0">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-800">
                    {authorName(comment)}
                  </span>
                  <span className="text-[10px] text-slate-400">{relTime(comment.created_at)}</span>
                </div>
                <p className="text-xs text-slate-700 mt-0.5 leading-relaxed break-words">{comment.text}</p>
              </div>
              {isLoggedIn && (userProfile?.id === comment.user?.id || userProfile?.role === 'admin') && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="shrink-0 text-slate-300 hover:text-red-400 transition-colors p-1 self-start mt-0.5"
                  title="Supprimer"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}

          {/* Comment input */}
          {isLoggedIn ? (
            <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
              <div className="shrink-0 w-7 h-7 rounded-full bg-[#00D4A8]/15 flex items-center justify-center text-[10px] font-bold text-[#00D4A8]">
                {userProfile ? getInitials(userProfile.name ?? 'U', userProfile.lastname ?? 'U') : 'U'}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Ajouter un commentaire…"
                  maxLength={1000}
                  className="flex-1 min-w-0 text-base sm:text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#00D4A8] focus:ring-1 focus:ring-[#00D4A8]/20 bg-white placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || submitting}
                  className="shrink-0 w-8 h-8 rounded-full bg-[#00D4A8] flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#00bfa0] transition-colors"
                >
                  <Send size={13} />
                </button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-center text-slate-400 py-2">
              <a href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="text-[#00D4A8] hover:underline font-medium">Connectez-vous</a> pour commenter
            </p>
          )}
        </div>
      )}
    </div>
  );
}
