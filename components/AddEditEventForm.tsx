import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/utils/theme';
import { API_BASE_URL } from '@/config';
import { TAGS } from '@/data/tags';
import type { Event } from '@/types';

type Props = {
  onClose: () => void;
  onEventCreated: () => void;
  existingEvent?: Event | null;
  userLocation?: { latitude: number; longitude: number } | null;
};

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

export default function AddEditEventForm({
  onClose,
  onEventCreated,
  existingEvent,
  userLocation,
}: Props) {
  const { token } = useAuth();
  const { themeMode, colorScheme } = useSettings();
  const theme = useTheme(themeMode, colorScheme);
  const isEditing = !!existingEvent;

  const [title, setTitle] = useState(existingEvent?.title || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [hostType, setHostType] = useState<'fraternity' | 'house' | 'club'>(
    existingEvent?.host_type || 'house'
  );
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(
    existingEvent?.location_lat?.toString() || userLocation?.latitude.toString() || ''
  );
  const [longitude, setLongitude] = useState(
    existingEvent?.location_lng?.toString() || userLocation?.longitude.toString() || ''
  );
  const [startTime, setStartTime] = useState(
    existingEvent ? new Date(existingEvent.start_time) : new Date()
  );
  const [endTime, setEndTime] = useState<Date | null>(
    existingEvent?.end_time ? new Date(existingEvent.end_time) : null
  );
  const [eventTheme, setEventTheme] = useState(existingEvent?.theme || '');
  const [musicType, setMusicType] = useState(existingEvent?.music_type || '');
  const [coverCharge, setCoverCharge] = useState(existingEvent?.cover_charge || '');
  const [isByob, setIsByob] = useState(existingEvent?.is_byob || false);
  const [selectedTags, setSelectedTags] = useState<string[]>(existingEvent?.tags || []);
  const [visibility, setVisibility] = useState<'everyone' | 'friends'>(
    existingEvent?.visibility || 'everyone'
  );

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Address search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const trimmedAddress = address.trim();
    if (trimmedAddress.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          format: 'json',
          q: trimmedAddress,
          limit: '10',
          addressdetails: '1',
          'accept-language': 'en',
        });

        if (userLocation) {
          const viewbox = makeViewbox(userLocation.latitude, userLocation.longitude);
          params.append('viewbox', viewbox);
          params.append('bounded', '1');
        }

        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'PartyFinderMobile/1.0',
          },
        });

        if (!res.ok) throw new Error('Search failed');

        const data = (await res.json()) as SearchResult[];
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      controller.abort();
    };
  }, [address, userLocation]);

  const makeViewbox = (latitude: number, longitude: number, offset = 0.45) => {
    const left = longitude - offset;
    const right = longitude + offset;
    const top = latitude + offset;
    const bottom = latitude - offset;
    return `${left},${top},${right},${bottom}`;
  };

  const handleSelectAddress = (result: SearchResult) => {
    setLatitude(result.lat);
    setLongitude(result.lon);
    setAddress(result.display_name);
    setSearchResults([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    if (!latitude || !longitude) {
      Alert.alert('Error', 'Location coordinates are required');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Error', 'Invalid coordinates');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        host_type: hostType,
        location_lat: lat,
        location_lng: lng,
        start_time: startTime.toISOString(),
        end_time: endTime?.toISOString() || null,
        theme: eventTheme.trim() || null,
        music_type: musicType.trim() || null,
        cover_charge: coverCharge.trim() || null,
        is_byob: isByob,
        tags: selectedTags,
        visibility,
      };

      const url = isEditing
        ? `${API_BASE_URL}/api/events/${existingEvent.id}`
        : `${API_BASE_URL}/api/events`;

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to ${isEditing ? 'update' : 'create'} event`);
      }

      Alert.alert('Success', `Event ${isEditing ? 'updated' : 'created'} successfully!`);
      onEventCreated();
      onClose();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (userLocation) {
      setLatitude(userLocation.latitude.toString());
      setLongitude(userLocation.longitude.toString());
    } else {
      Alert.alert('Error', 'Current location not available');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{isEditing ? 'Edit Event' : 'Create Event'}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, { color: theme.colors.text }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Title *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Event title"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Event description"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          numberOfLines={4}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Host Type *</Text>
        <View style={[styles.segmentControl, { backgroundColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.segmentButton, hostType === 'fraternity' && [styles.segmentActive, { backgroundColor: theme.colors.primary }]]}
            onPress={() => setHostType('fraternity')}>
            <Text
              style={[
                styles.segmentText,
                { color: theme.colors.text },
                hostType === 'fraternity' && styles.segmentTextActive,
              ]}>
              Fraternity
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, hostType === 'house' && [styles.segmentActive, { backgroundColor: theme.colors.primary }]]}
            onPress={() => setHostType('house')}>
            <Text style={[styles.segmentText, { color: theme.colors.text }, hostType === 'house' && styles.segmentTextActive]}>
              House
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, hostType === 'club' && [styles.segmentActive, { backgroundColor: theme.colors.primary }]]}
            onPress={() => setHostType('club')}>
            <Text style={[styles.segmentText, { color: theme.colors.text }, hostType === 'club' && styles.segmentTextActive]}>
              Club
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: theme.colors.text }]}>Location *</Text>
        <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>Search for an address or enter coordinates</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
          value={address}
          onChangeText={setAddress}
          placeholder="Search for address..."
          placeholderTextColor={theme.colors.textSecondary}
        />
        {isSearching && (
          <View style={styles.searchingIndicator}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.searchingText, { color: theme.colors.textSecondary }]}>Searching...</Text>
          </View>
        )}
        {searchResults.length > 0 && (
          <View style={[styles.searchResults, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <ScrollView style={styles.searchResultsList} nestedScrollEnabled>
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.searchResultItem, { borderBottomColor: theme.colors.border }]}
                  onPress={() => handleSelectAddress(result)}>
                  <Text style={[styles.searchResultText, { color: theme.colors.text }]}>{result.display_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        <View style={styles.locationRow}>
          <TextInput
            style={[styles.input, styles.locationInput, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
            value={latitude}
            onChangeText={setLatitude}
            placeholder="Latitude"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.input, styles.locationInput, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
            value={longitude}
            onChangeText={setLongitude}
            placeholder="Longitude"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="decimal-pad"
          />
        </View>
        <TouchableOpacity style={[styles.locationButton, { backgroundColor: theme.colors.primary }]} onPress={handleUseCurrentLocation}>
          <Text style={styles.locationButtonText}>📍 Use Current Location</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { color: theme.colors.text }]}>Start Date & Time *</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity 
            style={[styles.dateTimeButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} 
            onPress={() => setShowStartDatePicker(true)}>
            <Text style={[styles.dateTimeButtonLabel, { color: theme.colors.textSecondary }]}>Date</Text>
            <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>
              {startTime.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dateTimeButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} 
            onPress={() => setShowStartTimePicker(true)}>
            <Text style={[styles.dateTimeButtonLabel, { color: theme.colors.textSecondary }]}>Time</Text>
            <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>
              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>
        {showStartDatePicker && (
          <DateTimePicker
            value={startTime}
            mode="date"
            onChange={(event, date) => {
              setShowStartDatePicker(false);
              if (date) {
                const newDate = new Date(startTime);
                newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                setStartTime(newDate);
              }
            }}
          />
        )}
        {showStartTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            onChange={(event, date) => {
              setShowStartTimePicker(false);
              if (date) {
                const newDate = new Date(startTime);
                newDate.setHours(date.getHours(), date.getMinutes());
                setStartTime(newDate);
              }
            }}
          />
        )}

        <Text style={[styles.label, { color: theme.colors.text }]}>End Date & Time (Optional)</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity 
            style={[styles.dateTimeButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} 
            onPress={() => setShowEndDatePicker(true)}>
            <Text style={[styles.dateTimeButtonLabel, { color: theme.colors.textSecondary }]}>Date</Text>
            <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>
              {endTime ? endTime.toLocaleDateString() : 'Not set'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dateTimeButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} 
            onPress={() => setShowEndTimePicker(true)}>
            <Text style={[styles.dateTimeButtonLabel, { color: theme.colors.textSecondary }]}>Time</Text>
            <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>
              {endTime ? endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not set'}
            </Text>
          </TouchableOpacity>
        </View>
        {showEndDatePicker && (
          <DateTimePicker
            value={endTime || new Date()}
            mode="date"
            onChange={(event, date) => {
              setShowEndDatePicker(false);
              if (date) {
                const newDate = endTime ? new Date(endTime) : new Date(startTime);
                newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                setEndTime(newDate);
              }
            }}
          />
        )}
        {showEndTimePicker && (
          <DateTimePicker
            value={endTime || new Date()}
            mode="time"
            onChange={(event, date) => {
              setShowEndTimePicker(false);
              if (date) {
                const newDate = endTime ? new Date(endTime) : new Date(startTime);
                newDate.setHours(date.getHours(), date.getMinutes());
                setEndTime(newDate);
              }
            }}
          />
        )}
        {endTime && (
          <TouchableOpacity onPress={() => setEndTime(null)} style={[styles.clearButton, { backgroundColor: theme.colors.error }]}>
            <Text style={styles.clearButtonText}>Clear End Time</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.label, { color: theme.colors.text }]}>Theme</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
          value={eventTheme}
          onChangeText={setEventTheme}
          placeholder="e.g., 80s Night, Halloween"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Music Type</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
          value={musicType}
          onChangeText={setMusicType}
          placeholder="e.g., EDM, Hip Hop, Rock"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Cover Charge</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
          value={coverCharge}
          onChangeText={setCoverCharge}
          placeholder="e.g., $5, Free"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Tags</Text>
        <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>Select all that apply</Text>
        <View style={styles.tagsContainer}>
          {TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagChip,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                selectedTags.includes(tag) && [styles.tagChipSelected, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }],
              ]}
              onPress={() => toggleTag(tag)}>
              <Text
                style={[
                  styles.tagChipText,
                  { color: theme.colors.text },
                  selectedTags.includes(tag) && styles.tagChipTextSelected,
                ]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.switchRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.switchLabel, { color: theme.colors.text }]}>BYOB (Bring Your Own Bottle)</Text>
          <Switch
            value={isByob}
            onValueChange={setIsByob}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={isByob ? '#ffffff' : '#f3f4f6'}
          />
        </View>

        <Text style={[styles.label, { color: theme.colors.text }]}>Visibility</Text>
        <View style={[styles.segmentControl, { backgroundColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.segmentButton, visibility === 'everyone' && [styles.segmentActive, { backgroundColor: theme.colors.primary }]]}
            onPress={() => setVisibility('everyone')}>
            <Text
              style={[
                styles.segmentText,
                { color: theme.colors.text },
                visibility === 'everyone' && styles.segmentTextActive,
              ]}>
              Everyone
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, visibility === 'friends' && [styles.segmentActive, { backgroundColor: theme.colors.primary }]]}
            onPress={() => setVisibility('friends')}>
            <Text
              style={[
                styles.segmentText,
                { color: theme.colors.text },
                visibility === 'friends' && styles.segmentTextActive,
              ]}>
              Friends Only
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.colors.primary }, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? 'Update Event' : 'Create Event'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.colors.border }]} onPress={onClose}>
          <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#3b82f6',
  },
  segmentText: {
    fontSize: 14,
    color: '#6b7280',
  },
  segmentTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  dateTimeButtonLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
    color: '#6b7280',
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  locationInput: {
    flex: 1,
  },
  locationButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dateButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  clearButton: {
    marginTop: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
  },
  switchLabel: {
    fontSize: 16,
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  searchingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  searchResults: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchResultText: {
    fontSize: 14,
    color: '#374151',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagChip: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tagChipSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  tagChipText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tagChipTextSelected: {
    color: '#1e40af',
    fontWeight: '600',
  },
});
