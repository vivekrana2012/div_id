import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import client from '../api/client';
import { Post, Page } from '../api/types';
import { ArticlesStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<ArticlesStackParamList, 'Articles'>;

export default function ArticlesScreen({ navigation }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPosts(0, true);
    }, [])
  );

  async function loadPosts(pageNum: number, replace = false) {
    try {
      const res = await client.get<Page<Post>>('/posts', { params: { page: pageNum, size: 20 } });
      setPosts(replace ? res.data.content : [...posts, ...res.data.content]);
      setPage(pageNum);
      setHasMore(!res.data.last);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    loadPosts(0, true);
  }

  function handleLoadMore() {
    if (hasMore && !loading) {
      loadPosts(page + 1);
    }
  }

  function readingTime(body: string): string {
    const words = body.split(/\s+/).length;
    const mins = Math.max(1, Math.round(words / 200));
    return `${mins} min read`;
  }

  function renderItem({ item }: { item: Post }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Post', { id: item.id })}
      >
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardAuthor}>
            {item.author.displayName || item.author.username}
          </Text>
          <Text style={styles.cardDot}>·</Text>
          <Text style={styles.cardTime}>{readingTime(item.body)}</Text>
        </View>
        {item.body ? (
          <Text style={styles.cardExcerpt} numberOfLines={2}>
            {item.body.substring(0, 150)}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  if (loading && posts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Articles</Text>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <Text style={styles.empty}>No articles published yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 28, fontWeight: '700', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  list: { paddingHorizontal: 20 },
  card: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardAuthor: { fontSize: 13, color: '#666' },
  cardDot: { fontSize: 13, color: '#999', marginHorizontal: 6 },
  cardTime: { fontSize: 13, color: '#999' },
  cardExcerpt: { fontSize: 14, color: '#555', lineHeight: 20 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
});
