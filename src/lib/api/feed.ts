/**
 * Feed API client + React Query hooks.
 * Backend: apps/api-nest/src/modules/feed (mounted at /api/v1/feed).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { req, apiConfigured } from './gigvora';

export const feedApiConfigured = apiConfigured;

export interface FeedAuthor { id: string; name: string; avatar?: string | null; headline?: string | null; }
export interface FeedPostDto {
  id: string;
  authorId: string;
  author?: FeedAuthor;
  body: string;
  mediaUrls?: string[];
  hashtags?: string[];
  createdAt: string;
  reactionCount?: number;
  commentCount?: number;
  shareCount?: number;
  reactedByMe?: boolean | string;
  savedByMe?: boolean;
  context?: 'for-you' | 'network' | 'opportunities' | 'creators' | 'following';
}

export interface CreatePostInput {
  body: string;
  mediaUrls?: string[];
  hashtags?: string[];
  visibility?: 'public' | 'connections' | 'private';
  sharedEntityType?: string;
  sharedEntityId?: string;
}

export function useHomeFeed(context: string = 'for-you', limit = 25) {
  return useQuery({
    queryKey: ['feed', 'home', context, limit],
    queryFn: () => req<{ items: FeedPostDto[]; nextCursor?: string }>(`/api/v1/feed/home?context=${encodeURIComponent(context)}&limit=${limit}`),
    enabled: feedApiConfigured(),
    staleTime: 30_000,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePostInput) => req<FeedPostDto>(`/api/v1/feed/posts`, { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => {
      toast.success('Post published');
      qc.invalidateQueries({ queryKey: ['feed', 'home'] });
    },
    onError: (e: Error) => toast.error(`Could not publish: ${e.message}`),
  });
}

export function useReactToPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, reaction }: { postId: string; reaction: string }) =>
      req(`/api/v1/feed/posts/${postId}/reactions`, { method: 'POST', body: JSON.stringify({ reaction }) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['feed', 'home'] });
      qc.invalidateQueries({ queryKey: ['feed', 'post', vars.postId] });
    },
    onError: (e: Error) => toast.error(`Reaction failed: ${e.message}`),
  });
}

export function useUnreactToPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => req(`/api/v1/feed/posts/${postId}/reactions`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed', 'home'] }),
  });
}

export function useCommentOnPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: string }) =>
      req(`/api/v1/feed/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
    onSuccess: (_, vars) => {
      toast.success('Comment posted');
      qc.invalidateQueries({ queryKey: ['feed', 'comments', vars.postId] });
      qc.invalidateQueries({ queryKey: ['feed', 'home'] });
    },
    onError: (e: Error) => toast.error(`Comment failed: ${e.message}`),
  });
}

export function useToggleSavePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => req(`/api/v1/feed/posts/${postId}/saves`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useFollowAuthor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (authorId: string) => req(`/api/v1/feed/follows/${authorId}`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Following');
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useOpportunityCards(kind?: string, limit = 12) {
  return useQuery({
    queryKey: ['feed', 'opps', kind, limit],
    queryFn: () => req<{ items: unknown[] }>(`/api/v1/feed/opportunity-cards?${kind ? `kind=${encodeURIComponent(kind)}&` : ''}limit=${limit}`),
    enabled: feedApiConfigured(),
    staleTime: 60_000,
  });
}
