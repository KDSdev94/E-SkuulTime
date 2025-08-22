import { StyleSheet } from 'react-native';
import { getSafeFont } from '../utils/fontUtils';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 0,
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 0,
    borderColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  searchIcon: {
    marginRight: 8,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_400Regular'),
    color: '#2c3e50',
    includeFontPadding: false,
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fafbfc',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f0fe',
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatarContainer: {
    marginRight: 14,
  },

  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  avatarInitials: {
    fontSize: 18,
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: 'white',
    textAlign: 'center',
  },

  mainInfo: {
    flex: 1,
  },

  name: {
    fontSize: 18,
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: '#2c3e50',
    marginBottom: 6,
    lineHeight: 24,
  },

  metaInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  metaText: {
    fontSize: 12,
    fontFamily: getSafeFont('Nunito_500Medium'),
    color: '#333',
    marginLeft: 4,
  },

  infoRow: {
    marginBottom: 12,
  },

  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  infoLabel: {
    fontSize: 14,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    color: '#2c3e50',
    marginLeft: 6,
  },

  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },

  tagText: {
    fontSize: 11,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    color: '#1565c0',
  },

  noDataText: {
    fontSize: 12,
    fontFamily: getSafeFont('Nunito_400Regular'),
    color: '#444',
    fontStyle: 'italic',
  },

  moreTag: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  moreTagText: {
    fontSize: 11,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    color: '#666',
  },

  statusContainer: {
    alignItems: 'flex-end',
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  statusPNS: {
    backgroundColor: '#27ae60',
  },

  statusPPPK: {
    backgroundColor: '#9b59b6',
  },

  statusHonorer: {
    backgroundColor: '#f39c12',
  },

  statusAktif: {
    backgroundColor: '#27ae60',
  },

  statusTidakAktif: {
    backgroundColor: '#e74c3c',
  },

  statusLulus: {
    backgroundColor: '#3498db',
  },

  statusPindah: {
    backgroundColor: '#f39c12',
  },

  statusText: {
    fontSize: 12,
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: 'white',
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fafbfc',
    borderTopWidth: 1,
    borderTopColor: '#e8f0fe',
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    flex: 1,
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    justifyContent: 'center',
  },

  detailButton: {
    backgroundColor: '#17a2b8',
  },

  editButton: {
    backgroundColor: '#4A90E2',
  },

  deleteButton: {
    backgroundColor: '#e74c3c',
  },

  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
  },

  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },

  emptyListContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
    justifyContent: 'center',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
  },

  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_500Medium'),
    color: '#999',
    textAlign: 'center',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_500Medium'),
    color: '#4A90E2',
    textAlign: 'center',
  },

  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 12,
  },

  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  fabPrimary: {
    backgroundColor: '#4A90E2',
  },

  fabDanger: {
    backgroundColor: '#e74c3c',
  },

  fabAccent: {
    backgroundColor: '#9b59b6',
  },

  fabDisabled: {
    backgroundColor: '#95a5a6',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  modalTitle: {
    fontSize: 20,
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: '#2c3e50',
  },

  modalContent: {
    flex: 1,
    padding: 16,
  },

  formGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    color: '#2c3e50',
    marginBottom: 8,
  },

  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_400Regular'),
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    includeFontPadding: false,
  },

  inputError: {
    borderColor: '#e74c3c',
  },

  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  cancelButton: {
    backgroundColor: '#95a5a6',
  },

  saveButton: {
    backgroundColor: '#4A90E2',
  },

  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
  },

  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
  },

  saveButtonDisabled: {
    backgroundColor: '#95a5a6',
  },

  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 50,
  },

  picker: {
    height: 50,
    fontFamily: getSafeFont('Nunito_400Regular'),
    color: '#1e293b',
  },

  pickerItem: {
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_400Regular'),
    color: '#2c3e50',
  },

  pickerPlaceholder: {
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_400Regular'),
    color: '#999',
  },

  datePickerButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  datePickerText: {
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_400Regular'),
    color: '#2c3e50',
  },

  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  detailModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },

  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  detailModalTitle: {
    fontSize: 20,
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: '#2c3e50',
  },

  detailModalContent: {
    padding: 16,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },

  profileAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: 18,
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: '#2c3e50',
    marginBottom: 4,
  },

  profileSubtitle: {
    fontSize: 14,
    fontFamily: getSafeFont('Nunito_500Medium'),
    color: '#666',
  },

  profileBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    alignSelf: 'flex-start',
  },

  profileBadgeText: {
    fontSize: 12,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    color: 'white',
  },

  detailCard: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: '#2c3e50',
    marginLeft: 8,
  },

  detailRows: {
    gap: 12,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  detailLabel: {
    fontSize: 14,
    fontFamily: getSafeFont('Nunito_600SemiBold'),
    color: '#666',
    flex: 1,
  },

  detailValue: {
    fontSize: 14,
    fontFamily: getSafeFont('Nunito_400Regular'),
    color: '#2c3e50',
    flex: 2,
    textAlign: 'right',
  },

  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
