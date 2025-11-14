import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { Event } from '@/types';
import { eventCardStyles } from '@/styles/eventCard';
import { buttonStyles } from '@/styles/buttons';
import { formatDistance } from '@/utils/distance';

const HOST_LABELS: Record<Event['host_type'], string> = {
  fraternity: 'Fraternity/Greek',
  house: 'House Party',
  club: 'Campus Club',
};

interface EventCardProps {
  event: Event;
  isExpanded?: boolean;
  isOwner: boolean;
  distanceKm?: number | null;
  distanceUnit: 'km' | 'miles';
  theme: any;
  showCheckIn?: boolean;
  isCheckedIn?: boolean;
  isCheckingIn?: boolean;
  onToggleExpand?: () => void;
  onEdit?: () => void;
  onEnd?: () => void;
  onCheckIn?: () => void;
  ReplaySlot?: React.ReactNode; // gallery component injected from parent
}

export default function EventCard({
  event,
  isExpanded = false,
  isOwner,
  distanceKm,
  distanceUnit,
  theme,
  showCheckIn = false,
  isCheckedIn = false,
  isCheckingIn = false,
  onToggleExpand,
  onEdit,
  onEnd,
  onCheckIn,
  ReplaySlot,
}: EventCardProps) {
  const startTime = new Date(event.start_time);
  const endTime = event.end_time ? new Date(event.end_time) : null;

  const archived = !!event.is_archived;

  return (
    <TouchableOpacity
      style={[
        eventCardStyles.eventCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        archived && { opacity: 0.85 }
      ]}
      onPress={onToggleExpand}
      activeOpacity={0.7}>
      <View style={eventCardStyles.eventHeader}>
        <Text style={[eventCardStyles.eventTitle, { color: theme.colors.text }]}>{event.title}</Text>
        {distanceKm !== null && distanceKm !== undefined && (
          <Text style={[eventCardStyles.distance, { color: theme.colors.primary }]}>
            {formatDistance(distanceKm, distanceUnit)}
          </Text>
        )}
      </View>

      {archived && (
        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
          <Text style={{
            backgroundColor: '#9ca3af',
            color: '#1f2937',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 8,
            fontSize: 12,
            overflow: 'hidden'
          }}>Archived</Text>
          {event.archived_at && (
            <Text style={{ marginLeft: 8, fontSize: 12, color: theme.colors.textSecondary }}>
              {new Date(event.archived_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          )}
        </View>
      )}

      <Text style={[eventCardStyles.eventHost, { color: theme.colors.textSecondary }]}>
        {HOST_LABELS[event.host_type]}
      </Text>

      <Text style={[eventCardStyles.eventTime, { color: theme.colors.text }]}>
        {startTime.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
        {endTime && ` - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
      </Text>

      {event.checkin_count !== undefined && event.checkin_count > 0 && (
        <Text style={[eventCardStyles.eventTime, { color: theme.colors.textSecondary }]}>
          👥 {event.checkin_count} checked in
        </Text>
      )}

      {isExpanded && (
        <View style={[eventCardStyles.expandedContent, { borderTopColor: theme.colors.border }]}>
          {event.description && (
            <Text style={[eventCardStyles.eventDescription, { color: theme.colors.text }]}>
              {event.description}
            </Text>
          )}

          <View style={eventCardStyles.eventDetails}>
            {event.cover_charge && (
              <Text style={[eventCardStyles.detailText, { color: theme.colors.textSecondary }]}>
                💵 {event.cover_charge}
              </Text>
            )}
            {event.music_type && (
              <Text style={[eventCardStyles.detailText, { color: theme.colors.textSecondary }]}>
                🎵 {event.music_type}
              </Text>
            )}
            {event.is_byob && (
              <Text style={[eventCardStyles.detailText, { color: theme.colors.textSecondary }]}>
                🍺 BYOB
              </Text>
            )}
          </View>

          {event.tags && event.tags.length > 0 && (
            <View style={eventCardStyles.tags}>
              {event.tags.map((tag, idx) => (
                <View key={idx} style={[eventCardStyles.tag, { borderColor: theme.colors.primary }]}>
                  <Text style={[eventCardStyles.tagText, { color: theme.colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Owner actions */}
          {isOwner && !archived && (
            <View>
              <TouchableOpacity
                style={[buttonStyles.editEventButton, { backgroundColor: theme.colors.primary }]}
                onPress={onEdit}>
                <Text style={buttonStyles.editEventButtonText}>Edit Event</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[buttonStyles.endEventButton, { backgroundColor: '#f59e0b' }]}
                onPress={onEnd}>
                <Text style={buttonStyles.endEventButtonText}>End Event</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Check-in button for non-owners */}
          {!isOwner && showCheckIn && onCheckIn && !archived && (
            <TouchableOpacity
              style={[
                buttonStyles.checkInButton,
                { backgroundColor: isCheckedIn ? '#9ca3af' : '#10b981' },
                isCheckedIn && buttonStyles.checkInButtonDisabled,
              ]}
              onPress={onCheckIn}
              disabled={isCheckedIn || isCheckingIn}>
              {isCheckingIn ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={buttonStyles.checkInButtonText}>
                  {isCheckedIn ? '✓ Checked In' : 'Check In'}
                </Text>
              )}
            </TouchableOpacity>
          )}
          {archived && (
            <Text style={{ marginTop: 8, fontSize: 12, color: theme.colors.textSecondary }}>Event has ended.</Text>
          )}

          {archived && isExpanded && <>{/* Replay system slot */}{ReplaySlot}</>}
        </View>
      )}
    </TouchableOpacity>
  );
}
