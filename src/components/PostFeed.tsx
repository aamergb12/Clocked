// src/components/PostFeed.tsx
import React, { useCallback, useMemo } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  Dimensions,
} from 'react-native'
import { usePosts } from '../hooks/usePosts'
import { useAuth } from '../hooks/useAuth'
import PostCard from './PostCard'
import { Post } from '../types'

const { width } = Dimensions.get('window')

interface PostFeedProps {
  onPostPress?: (post: Post) => void
  onUserPress?: (userId: string) => void
}

export default function PostFeed({ onPostPress, onUserPress }: PostFeedProps) {
  // Hooks
  const { user } = useAuth()
  const {
    posts,
    isLoading,
    error,
    hasMore,
    isLoadingMore,
    refresh,
    loadMore,
  } = usePosts(user?.id)

  // Render post item
  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={user?.id}
      onPress={() => onPostPress?.(item)}
      onUserPress={() => onUserPress?.(item.created_by)}
    />
  ), [user?.id, onPostPress, onUserPress])

  // Key extractor
  const keyExtractor = useCallback((item: Post) => item.id, [])

  // Item separator
  const ItemSeparator = useCallback(() => (
    <View style={styles.separator} />
  ), [])

  // Footer component (loading more indicator)
  const ListFooter = useCallback(() => {
    if (!isLoadingMore) return null
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.footerText}>Loading more posts...</Text>
      </View>
    )
  }, [isLoadingMore])

  // Empty state
  const EmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Posts Yet</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to share someone's vibe!
      </Text>
    </View>
  ), [])

  // Error state
  const ErrorState = useCallback(() => (
    <View style={styles.errorState}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
    </View>
  ), [error])

  // Handle end reached (load more)
  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      loadMore()
    }
  }, [hasMore, isLoadingMore, isLoading, loadMore])

  // Memoized refresh control
  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={isLoading}
      onRefresh={refresh}
      colors={['#ff6b6b']}
      tintColor="#ff6b6b"
      title="Pull to refresh"
      titleColor="#999"
    />
  ), [isLoading, refresh])

  // Show error state
  if (error && !posts.length) {
    return <ErrorState />
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={!isLoading ? EmptyState : null}
        ListFooterComponent={ListFooter}
        refreshControl={refreshControl}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={3}
        getItemLayout={(_data, index) => ({
          length: 400, // Estimated item height
          offset: 400 * index,
          index,
        })}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
  },
  footerLoader: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#999',
    fontSize: 14,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ff3b30',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
})