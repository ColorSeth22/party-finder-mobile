import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFriends } from '@/contexts/FriendsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/utils/theme';
import type { Friend, FriendRequest } from '@/types';

type TabType = 'friends' | 'incoming' | 'outgoing';

export default function FriendsScreen() {
  const { friends, friendRequests, outgoingRequests, isLoading, addFriend, acceptRequest, rejectRequest, removeFriend, cancelRequest } = useFriends();
  const { themeMode, colorScheme } = useSettings();
  const theme = useTheme(themeMode, colorScheme);
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [identifier, setIdentifier] = useState('');

  const handleAddFriend = async () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'Please enter an email or code');
      return;
    }

    try {
      await addFriend(identifier.trim());
      setIdentifier('');
      Alert.alert('Success', 'Friend request sent!');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send request');
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await acceptRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to accept request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest(requestId);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to reject request');
    }
  };

  const handleRemove = async (friendshipId: string, displayName: string | null) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${displayName || 'this friend'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendshipId);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const handleCancel = async (requestId: string) => {
    try {
      await cancelRequest(requestId);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to cancel request');
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.cardContent}>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {item.display_name || item.email}
        </Text>
        {item.display_name && (
          <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{item.email}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.button, styles.removeButton]}
        onPress={() => handleRemove(item.friendship_id, item.display_name)}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderIncomingRequest = ({ item }: { item: FriendRequest }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.cardContent}>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {item.from_user?.display_name || item.from_user?.email}
        </Text>
        {item.from_user?.display_name && item.from_user?.email && (
          <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{item.from_user.email}</Text>
        )}
      </View>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={() => handleAccept(item.request_id)}>
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => handleReject(item.request_id)}>
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOutgoingRequest = ({ item }: { item: FriendRequest }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.cardContent}>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {item.to_user?.display_name || item.to_user?.email}
        </Text>
        {item.to_user?.display_name && item.to_user?.email && (
          <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{item.to_user.email}</Text>
        )}
        <Text style={[styles.pending, { color: theme.colors.textSecondary }]}>Pending</Text>
      </View>
      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={() => handleCancel(item.request_id)}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => {
    let message = '';
    if (activeTab === 'friends') message = 'No friends yet. Add friends by email below!';
    else if (activeTab === 'incoming') message = 'No incoming friend requests';
    else message = 'No outgoing friend requests';

    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{message}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Add Friend Section */}
      <View style={styles.addSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Add Friend</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Enter email or friend code"
            placeholderTextColor={theme.colors.textSecondary}
            value={identifier}
            onChangeText={setIdentifier}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddFriend}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.addButtonText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('friends')}>
          <Text style={[styles.tabText, { color: activeTab === 'friends' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'incoming' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('incoming')}>
          <Text style={[styles.tabText, { color: activeTab === 'incoming' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Requests ({friendRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'outgoing' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('outgoing')}>
          <Text style={[styles.tabText, { color: activeTab === 'outgoing' ? theme.colors.primary : theme.colors.textSecondary }]}>
            Sent ({outgoingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {activeTab === 'friends' && (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.friendship_id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
        />
      )}
      {activeTab === 'incoming' && (
        <FlatList
          data={friendRequests}
          renderItem={renderIncomingRequest}
          keyExtractor={(item) => item.request_id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
        />
      )}
      {activeTab === 'outgoing' && (
        <FlatList
          data={outgoingRequests}
          renderItem={renderOutgoingRequest}
          keyExtractor={(item) => item.request_id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
  },
  pending: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  removeButton: {
    backgroundColor: '#ef4444',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
