import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import EventMediaGallery from './EventMediaGallery';
import type { Event } from '@/types';
import { layoutStyles } from '@/styles/layout';
import { buttonStyles } from '@/styles/buttons';

interface MediaModalProps {
  visible: boolean;
  event: Event | null;
  token: string | null;
  isHost: boolean;
  isAttendee: boolean;
  theme: any;
  onClose: () => void;
}

export default function MediaModal({
  visible,
  event,
  token,
  isHost,
  isAttendee,
  theme,
  onClose
}: MediaModalProps) {
  if (!event) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}>
      <ScrollView 
        style={{ flex: 1, backgroundColor: theme.colors.background }} 
        contentContainerStyle={{ padding: 16 }}>
        <View>
          <Text style={[layoutStyles.title, { color: theme.colors.text }]}>
            {event.title}
          </Text>
          {event.description && (
            <Text style={{ marginTop: 8, color: theme.colors.text }}>
              {event.description}
            </Text>
          )}
          <Text style={{ marginTop: 4, fontSize: 12, color: theme.colors.textSecondary }}>
            Archived {event.archived_at 
              ? new Date(event.archived_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                }) 
              : ''}
          </Text>
          <View style={{ marginTop: 16 }}>
            <EventMediaGallery
              event={event}
              token={token}
              isHost={isHost}
              isAttendee={isAttendee}
              theme={theme}
            />
          </View>
          <TouchableOpacity
            style={[buttonStyles.checkInButton, { marginTop: 20, backgroundColor: theme.colors.primary }]}
            onPress={onClose}
          >
            <Text style={[buttonStyles.checkInButtonText, { color: '#fff' }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}
