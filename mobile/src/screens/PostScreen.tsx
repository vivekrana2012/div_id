import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import client from '../api/client';
import { Post } from '../api/types';
import { useAuth } from '../context/AuthContext';

export default function PostScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPost();
  }, [id]);

  async function loadPost() {
    try {
      const res = await client.get<Post>(`/posts/${id}`);
      setPost(res.data);
    } catch {
      setError('Article not found');
    } finally {
      setLoading(false);
    }
  }

  function readingTime(body: string): string {
    const words = body.split(/\s+/).length;
    const mins = Math.max(1, Math.round(words / 200));
    return `${mins} min read`;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Article not found'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAuthor = user?.id === post.author.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{post.title}</Text>

      <View style={styles.meta}>
        <Text style={styles.author}>
          {post.author.displayName || post.author.username}
        </Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.time}>{readingTime(post.body)}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.date}>
          {new Date(post.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.body}>{post.body}</Text>

      {isAuthor && post.notes ? (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Your Notes</Text>
          <Text style={styles.notesBody}>{post.notes}</Text>
        </View>
      ) : null}

      {isAuthor ? (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('Editor', { id: post.id })}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { fontSize: 16, color: '#555', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12, lineHeight: 36 },
  meta: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  author: { fontSize: 14, color: '#444' },
  dot: { fontSize: 14, color: '#999', marginHorizontal: 8 },
  time: { fontSize: 14, color: '#666' },
  date: { fontSize: 14, color: '#666' },
  body: { fontSize: 16, lineHeight: 26, color: '#222' },
  notesSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f9f9f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8d8',
  },
  notesLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase' },
  notesBody: { fontSize: 14, lineHeight: 22, color: '#555' },
  editButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#111',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  errorText: { fontSize: 16, color: '#666', marginBottom: 12 },
  backLink: { fontSize: 16, color: '#111', fontWeight: '600' },
});
