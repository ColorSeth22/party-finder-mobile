import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import type { Event } from '@/types';
import { eventCardStyles } from '@/styles/eventCard';
import { buttonStyles } from '@/styles/buttons';
import { mapStyles } from '@/styles/map';
import { formatDistance, getDistanceKm } from '@/utils/distance';

const HOST_LABELS: Record<Event['host_type'], string> = {
  fraternity: 'Fraternity/Greek',
  house: 'House Party',
  club: 'Campus Club',
};

interface MapEventCardProps {
  event: Event;
  isOwner: boolean;
  coords: { latitude: number; longitude: number } | null;
  distanceUnit: 'km' | 'miles';
  showDistanceLabels: boolean;
  refreshing: boolean;
  isCheckedIn: boolean;
  isCheckingIn: boolean;
  onRefresh: () => void;
  onEdit: () => void;
  onEnd: () => void;
  onDelete: () => void;
  onCheckIn: () => void;
  onClose: () => void;
}

export default function MapEventCard({
  event,
  isOwner,
  coords,
  distanceUnit,
  showDistanceLabels,
  refreshing,
  isCheckedIn,
  isCheckingIn,
  onRefresh,
  onEdit,
  onEnd,
  onDelete,
  onCheckIn,
  onClose,
}: MapEventCardProps) {
  return (
    <View style={mapStyles.eventCard}>
      <ScrollView
        style={eventCardStyles.eventScrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={eventCardStyles.eventTitle}>{event.title}</Text>
        <Text style={eventCardStyles.eventHost}>{HOST_LABELS[event.host_type]}</Text>
        {event.description && (
          <Text style={eventCardStyles.eventDescription}>{event.description}</Text>
        )}
        <View style={eventCardStyles.eventDetails}>
          <Text style={eventCardStyles.eventDetailText}>
            🎉 Starts: {new Date(event.start_time).toLocaleString()}
          </Text>
          {event.end_time && (
            <Text style={eventCardStyles.eventDetailText}>
              ⏰ Ends: {new Date(event.end_time).toLocaleString()}
            </Text>
          )}
          {event.theme && (
            <Text style={eventCardStyles.eventDetailText}>🎭 Theme: {event.theme}</Text>
          )}
          {event.music_type && (
            <Text style={eventCardStyles.eventDetailText}>🎵 Music: {event.music_type}</Text>
          )}
          {event.cover_charge && (
            <Text style={eventCardStyles.eventDetailText}>💵 Cover: {event.cover_charge}</Text>
          )}
          {event.is_byob && <Text style={eventCardStyles.eventDetailText}>🍺 BYOB</Text>}
          {event.checkin_count !== undefined && (
            <Text style={eventCardStyles.eventDetailText}>
              👥 {event.checkin_count} checked in
            </Text>
          )}
          {coords && showDistanceLabels && (
            <Text style={eventCardStyles.eventDetailText}>
              📍{' '}
              {formatDistance(
                getDistanceKm(
                  coords.latitude,
                  coords.longitude,
                  event.location_lat,
                  event.location_lng
                ),
                distanceUnit
              )}
            </Text>
          )}
        </View>

        {/* Owner actions */}
        {isOwner && (
          <View style={buttonStyles.eventActions}>
            <TouchableOpacity style={buttonStyles.editButton} onPress={onEdit}>
              <Text style={buttonStyles.editButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={buttonStyles.endEventButton} onPress={onEnd}>
              <Text style={buttonStyles.endEventButtonText}>🏁 End Event</Text>
            </TouchableOpacity>
            <TouchableOpacity style={buttonStyles.deleteButton} onPress={onDelete}>
              <Text style={buttonStyles.deleteButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Check-in button for non-owners */}
        {!isOwner && (
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
                {isCheckedIn ? '✓ Checked In' : '📍 Check In'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={buttonStyles.closeButton} onPress={onClose}>
          <Text style={buttonStyles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
