import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import client from '../api/client';
import { Post, PostRequest } from '../api/types';

export default function EditorScreen({ route, navigation }: any) {
  const postId = route.params?.id;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  
  // Auto-save state
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lastSavedText, setLastSavedText] = useState('now');
  const [autoSaveError, setAutoSaveError] = useState('');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (postId) {
      loadPost();
    }
  }, [postId]);

  // Update "last saved" text every minute
  useEffect(() => {
    const updateText = () => {
      if (lastSavedAt) {
        const diffMs = Date.now() - lastSavedAt.getTime();
        if (diffMs < 60000) {
          setLastSavedText('now');
        } else if (diffMs < 3600000) {
          const mins = Math.floor(diffMs / 60000);
          setLastSavedText(`${mins} min${mins > 1 ? 's' : ''} ago`);
        } else {
          const hours = Math.floor(diffMs / 3600000);
          setLastSavedText(`${hours} hr${hours > 1 ? 's' : ''} ago`);
        }
      }
    };
    updateText();
    updateTimerRef.current = setInterval(updateText, 60000);
    return () => {
      if (updateTimerRef.current) clearInterval(updateTimerRef.current);
    };
  }, [lastSavedAt]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      if (updateTimerRef.current) clearInterval(updateTimerRef.current);
    };
  }, []);

  async function loadPost() {
    try {
      const res = await client.get<Post>(`/articles/${postId}`);
      setTitle(res.data.title);
      setBody(res.data.body);
      setNotes(res.data.notes || '');
      setStatus(res.data.status);
      setLastSavedAt(new Date());
    } catch {
      Alert.alert('Error', 'Failed to load post');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  // Auto-save: only save drafts, debounced 30 seconds
  const autoSave = useCallback(
    async (currentTitle: string, currentBody: string, currentNotes: string) => {
      // Only auto-save drafts, and only if there's something to save
      if (!currentTitle.trim() && !currentBody.trim() && !currentNotes.trim()) {
        return;
      }

      try {
        setAutoSaveError('');
        const payload: PostRequest = {
          title: currentTitle.trim(),
          body: currentBody,
          notes: currentNotes,
          status: 'draft', // Always auto-save as draft
        };
        if (postId) {
          await client.put(`/articles/${postId}`, payload);
        } else {
          const res = await client.post('/articles', payload);
          // Update the postId for future saves
          route.params = { ...route.params, id: res.data.id };
        }
        setLastSavedAt(new Date());
      } catch (err: any) {
        const msg = err.response?.data?.error || 'Auto-save failed';
        setAutoSaveError(msg);
      }
    },
    [postId, route]
  );

  // Track changes and debounce auto-save
  const handleTitleChange = (value: string) => {
    setTitle(value);
    setAutoSaveError('');
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(value, body, notes);
    }, 30000);
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    setAutoSaveError('');
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(title, value, notes);
    }, 30000);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setAutoSaveError('');
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(title, body, value);
    }, 30000);
  };

  async function save(publishStatus: string) {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    setSaving(true);
    try {
      const payload: PostRequest = {
        title: title.trim(),
        body,
        notes,
        status: publishStatus,
      };
      if (postId) {
        await client.put(`/articles/${postId}`, payload);
      } else {
        await client.post('/articles', payload);
      }
      navigation.goBack();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to save';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!postId) return;
    Alert.alert('Delete Post', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/articles/${postId}`);
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.saveDraftBtn}
              onPress={() => save('draft')}
              disabled={saving}
            >
              <Text style={styles.saveDraftText}>
                {saving ? '...' : 'Save Draft'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.publishBtn}
              onPress={() => save('published')}
              disabled={saving}
            >
              <Text style={styles.publishText}>
                {saving ? '...' : 'Publish'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {autoSaveError && (
          <Text style={styles.errorText}>{autoSaveError}</Text>
        )}

        {lastSavedAt && (
          <Text style={styles.lastSavedText}>Last saved: {lastSavedText}</Text>
        )}

        <TextInput
          style={styles.titleInput}
          placeholder="Title"
          value={title}
          onChangeText={handleTitleChange}
          multiline
          scrollEnabled={false}
        />

        <TextInput
          style={styles.bodyInput}
          placeholder="Write your story..."
          value={body}
          onChangeText={handleBodyChange}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
        />

        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Scratch Pad (private)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Notes, references, ideas..."
            value={notes}
            onChangeText={handleNotesChange}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />
        </View>

        {postId ? (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete Post</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cancel: { fontSize: 16, color: '#666' },
  actions: { flexDirection: 'row', gap: 8 },
  saveDraftBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveDraftText: { fontSize: 14, color: '#444' },
  publishBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#111',
  },
  publishText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  errorText: { fontSize: 12, color: '#e11', marginBottom: 8 },
  lastSavedText: { fontSize: 12, color: '#888', marginBottom: 16 },
  titleInput: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 34,
  },
  bodyInput: {
    fontSize: 16,
    lineHeight: 26,
    minHeight: 200,
    color: '#222',
  },
  notesSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f9f9f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8d8',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  notesInput: {
    fontSize: 14,
    lineHeight: 22,
    minHeight: 80,
    color: '#555',
  },
  deleteBtn: {
    marginTop: 32,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteText: { color: '#e11', fontSize: 15 },
});
