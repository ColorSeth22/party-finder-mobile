import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Event, EventMedia } from '@/types';
import { buttonStyles } from '@/styles/buttons';
import { API_BASE_URL } from '@/config';

interface EventMediaGalleryProps {
  event: Event;
  token: string | null;
  isHost: boolean;
  isAttendee: boolean; // user checked in
  theme: any;
}

export default function EventMediaGallery({ event, token, isHost, isAttendee, theme }: EventMediaGalleryProps) {
  const [media, setMedia] = useState<EventMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verifiedAttendee, setVerifiedAttendee] = useState<boolean>(isAttendee);
  const [verifying, setVerifying] = useState(false);

  const canUpload = !!token && event.is_archived && (isHost || verifiedAttendee);

  const fetchMedia = useCallback(async () => {
    if (!event.is_archived) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${event.id}/media`);
      if (!res.ok) {
        console.error('Failed to load media', await res.text());
        return;
      }
      const data = await res.json();
      setMedia(data);
    } catch (err) {
      console.error('Error loading media', err);
    } finally {
      setLoading(false);
    }
  }, [event.id, event.is_archived]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  // Fallback attendance verification if not host and not already flagged attendee
  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (!token || !event.is_archived || isHost || verifiedAttendee) return;
      setVerifying(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/checkins`, { headers: { 'authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            const ids = new Set<string>(data.map((c: any) => c.event_id));
            if (ids.has(event.id)) setVerifiedAttendee(true);
          }
        }
      } catch (_) { /* ignore */ }
      finally { if (!cancelled) setVerifying(false); }
    }
    verify();
    return () => { cancelled = true; };
  }, [token, event.id, event.is_archived, isHost, verifiedAttendee]);

  const pickAndUpload = async () => {
    if (!canUpload || !token) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Media library access is needed to upload');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.7 });
    if (res.canceled || !res.assets || res.assets.length === 0) return;
    const asset = res.assets[0];
    const uri = asset.uri;
    const name = asset.fileName || `upload-${Date.now()}`;
    const typeGuess = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';

    setUploading(true);
    try {
      const form = new FormData();
      form.append('media', { uri, name, type: typeGuess } as any);
      const upRes = await fetch(`${API_BASE_URL}/api/events/${event.id}/media`, {
        method: 'POST',
        headers: { 'authorization': `Bearer ${token}` },
        body: form
      });
      if (!upRes.ok) {
        console.error('Upload failed', await upRes.text());
        Alert.alert('Upload Failed', 'Could not upload media');
        return;
      }
      await fetchMedia();
      Alert.alert('Success', 'Media uploaded');
    } catch (err) {
      console.error('Upload error', err);
      Alert.alert('Error', 'Upload encountered an error');
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (mediaId: string) => {
    if (!isHost || !token) return;
    
    Alert.alert(
      'Delete Media',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const delRes = await fetch(`${API_BASE_URL}/api/events/${event.id}/media/${mediaId}`, {
                method: 'DELETE',
                headers: { 'authorization': `Bearer ${token}` }
              });
              if (!delRes.ok) {
                console.error('Delete failed', await delRes.text());
                Alert.alert('Delete Failed', 'Could not delete media');
                return;
              }
              await fetchMedia();
              Alert.alert('Success', 'Media deleted');
            } catch (err) {
              console.error('Delete error', err);
              Alert.alert('Error', 'Delete encountered an error');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontWeight: '600', marginBottom: 6, color: theme.colors.text }}>Event Replay</Text>
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : media.length === 0 ? (
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>No media yet. {canUpload ? 'Be the first to add a photo or video.' : ''}</Text>
      ) : (
        <FlatList
          data={media}
          horizontal
          keyExtractor={(m) => m.media_id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <View style={{ width: 120 }}>
              {item.media_type === 'image' ? (
                <Image 
                  source={{ uri: `${API_BASE_URL}/api/events/${event.id}/media/${item.media_id}/file` }} 
                  style={{ width: 120, height: 120, borderRadius: 8 }} 
                />
              ) : (
                <View style={{ width: 120, height: 120, borderRadius: 8, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 12 }}>Video</Text>
                </View>
              )}
              {item.caption && (
                <Text numberOfLines={2} style={{ fontSize: 11, marginTop: 4, color: theme.colors.text }}>{item.caption}</Text>
              )}
              {isHost && (
                <TouchableOpacity
                  style={{ marginTop: 4, backgroundColor: '#ef4444', padding: 4, borderRadius: 4, alignItems: 'center' }}
                  onPress={() => deleteMedia(item.media_id)}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
      {canUpload && (
        <TouchableOpacity
          style={[buttonStyles.checkInButton, { marginTop: 10, backgroundColor: theme.colors.primary }]}
          onPress={pickAndUpload}
          disabled={uploading}
        >
          <Text style={[buttonStyles.checkInButtonText, { color: '#fff' }]}>{uploading ? 'Uploading…' : 'Add Photo/Video'}</Text>
        </TouchableOpacity>
      )}
      {!canUpload && event.is_archived && !isHost && !verifiedAttendee && !verifying && (
        <Text style={{ marginTop: 8, fontSize: 11, color: theme.colors.textSecondary }}>Upload disabled: only host or checked-in attendees can contribute.</Text>
      )}
      {verifying && (
        <Text style={{ marginTop: 8, fontSize: 11, color: theme.colors.textSecondary }}>Verifying attendance…</Text>
      )}
    </View>
  );
}
