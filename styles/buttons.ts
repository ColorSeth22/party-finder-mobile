import { StyleSheet } from 'react-native';

export const buttonStyles = StyleSheet.create({
  // Action buttons
  checkInButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  checkInButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  checkInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editEventButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  editEventButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  endEventButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  endEventButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Event actions (edit/delete)
  eventActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  editButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
});
