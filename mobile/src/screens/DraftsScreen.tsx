import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import client from '../api/client';
import { Post, Page } from '../api/types';
import { DraftsStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<DraftsStackParamList, 'Drafts'>;

export default function DraftsScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadDrafts(0, true);
    }, [])
  );

  async function loadDrafts(pageNum: number, replace = false) {
    try {
      const res = await client.get<Page<Post>>('/articles/mine', { params: { page: pageNum, size: 20 } });
      const drafts = res.data.content.filter((p) => p.status === 'draft');
      setPosts(replace ? drafts : [...posts, ...drafts]);
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
    loadDrafts(0, true);
  }

  function handleLoadMore() {
    if (hasMore && !loading) {
      loadDrafts(page + 1);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Draft', 'Are you sure you want to delete this draft?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/articles/${id}`);
            setPosts(posts.filter((p) => p.id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete draft');
          }
        },
      },
    ]);
  }

  function renderItem({ item }: { item: Post }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Editor', { id: item.id })}
        onLongPress={() => handleDelete(item.id)}
      >
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title || 'Untitled'}
        </Text>
        <Text style={styles.cardDate}>
          {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
        {item.body ? (
          <Text style={styles.cardExcerpt} numberOfLines={2}>
            {item.body.substring(0, 100)}
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
      <View style={styles.headerRow}>
        <Text style={styles.header}>Drafts</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>
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
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>No drafts yet.</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('Editor', {})}
            >
              <Text style={styles.createButtonText}>Create your first post</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  header: { fontSize: 28, fontWeight: '700' },
  logout: { fontSize: 14, color: '#e11' },
  list: { paddingHorizontal: 20 },
  card: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  cardDate: { fontSize: 12, color: '#999', marginBottom: 4 },
  cardExcerpt: { fontSize: 14, color: '#666', lineHeight: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  empty: { fontSize: 15, color: '#999', marginBottom: 16 },
  createButton: {
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
