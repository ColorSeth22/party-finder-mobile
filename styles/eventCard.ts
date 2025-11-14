import { StyleSheet } from 'react-native';

export const eventCardStyles = StyleSheet.create({
  eventCard: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  eventHost: {
    fontSize: 14,
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  eventScrollView: {
    padding: 20,
  },
  distance: {
    fontSize: 14,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  eventDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDetailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
