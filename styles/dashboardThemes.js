import { StyleSheet, Platform } from 'react-native';

export const themes = {
  murid: {
    primary: 'rgb(108, 212, 127)',
    primaryLight: 'rgb(148, 232, 167)',
    primaryDark: 'rgb(88, 192, 107)',
    accent: 'rgba(108, 212, 127, 0.3)',  /* Brightened accent color for visibility */
    text: '#1e293b',
    textLight: '#3d4758',
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    headerBackground: '#4ECDC4',
    welcomeCard: '#4A90E2',
    menuIcon: '#4A90E2',
    menuIconLogout: '#EF4444',
    tabActive: '#4A90E2',
    tabInactive: '#8E8E93',
    tabBackground: '#E8F4FD',
  },
  
  guru: {
    primary: 'rgb(124, 58, 237)',
    primaryLight: 'rgb(168, 85, 247)',
    primaryDark: 'rgb(104, 38, 217)',
    accent: 'rgba(124, 58, 237, 0.3)',
    text: '#1e293b',
    textLight: '#64748b',
    background: '#f3e8ff',
    card: '#f5f3ff',
    border: '#e5e7eb',
    headerBackground: 'rgb(168, 85, 247)',
    welcomeCard: '#a855f7',
    menuIcon: '#a855f7',
    menuIconLogout: '#dc2626',
    tabActive: '#a855f7',
    tabInactive: '#8e8e93',
    tabBackground: '#ede9fe',
  },
  
  admin: {
    primary: 'rgb(37, 99, 235)',    // Blue theme for regular admin
    primaryLight: 'rgb(59, 130, 246)',
    primaryDark: 'rgb(29, 78, 216)',
    accent: 'rgba(37, 99, 235, 0.3)',
    text: '#1e293b',
    textLight: '#64748b',
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    headerBackground: 'rgb(59, 130, 246)',
    welcomeCard: '#3b82f6',
    menuIcon: '#3b82f6',
    menuIconLogout: '#dc2626',
    tabActive: '#3b82f6',
    tabInactive: '#8e8e93',
    tabBackground: '#dbeafe',
  },
  
  kaprodi: {
    primary: 'rgb(220, 38, 38)',    // Red theme for kaprodi
    primaryLight: 'rgb(239, 68, 68)',
    primaryDark: 'rgb(185, 28, 28)',
    accent: 'rgba(220, 38, 38, 0.3)',
    text: '#1e293b',
    textLight: '#64748b',
    background: '#fef2f2',
    card: '#ffffff',
    border: '#e2e8f0',
    headerBackground: 'rgb(239, 68, 68)',
    welcomeCard: '#ef4444',
    menuIcon: '#ef4444',
    menuIconLogout: '#dc2626',
    tabActive: '#ef4444',
    tabInactive: '#8e8e93',
    tabBackground: '#fee2e2',
  },
  
  prodi: {
    primary: 'rgb(34, 197, 94)',
    primaryLight: 'rgb(74, 222, 128)',
    primaryDark: 'rgb(22, 163, 74)',
    accent: 'rgba(34, 197, 94, 0.3)',
    text: '#1e293b',
    textLight: '#64748b',
    background: '#f0fdf4',
    card: '#f7fee7',
    border: '#e5e7eb',
    headerBackground: 'rgb(74, 222, 128)',
    welcomeCard: '#22c55e',
    menuIcon: '#22c55e',
    menuIconLogout: '#dc2626',
    tabActive: '#22c55e',
    tabInactive: '#8e8e93',
    tabBackground: '#dcfce7',
  },
};

// Function to get theme based on admin role
export const getAdminTheme = (userRole) => {
  switch (userRole) {
    case 'kaprodi_tkj':
    case 'kaprodi_tkr':
      return themes.kaprodi;
    case 'admin':
    case 'superadmin':
    case 'waka_kurikulum':
    case 'wakasek_kurikulum':
    case 'wakasek_kesiswaan':
    case 'kepala_sekolah':
    default:
      return themes.admin;
  }
};

export const createDashboardStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.headerBackground,
  },
  header: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Nunito_400Regular',
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#ffffff',
    marginTop: 4,
  },
  userRole: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.9)', // Red color with transparency
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickInfoContainer: {
    padding: 20,
    backgroundColor: theme.card,
    margin: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickInfoTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: theme.text,
    marginBottom: 12,
  },
  quickInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickInfoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: theme.primary,
    elevation: 3,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  quickInfoText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: theme.textLight,
    textAlign: 'center',
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: theme.text,
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: theme.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  menuIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItemTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: theme.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: theme.primary,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: theme.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  newContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  flex: {
    flex: 1,
  },
  homeContainer: {
    flex: 1,
    backgroundColor: theme.headerBackground,
  },
  content: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: theme.background,
  },
  newHeader: {
    height: 200,
    position: 'relative',
  },
  newHeaderBackground: {
    backgroundColor: theme.headerBackground,
    height: 150,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#E0E0E0',
  },
  newWelcomeSection: {
    paddingHorizontal: 20,
    marginTop: -50,
    marginBottom: 20,
  },
  newWelcomeCard: {
    backgroundColor: theme.welcomeCard,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newWelcomeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 8,
  },
  newWelcomeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    marginBottom: 4,
    opacity: 0.9,
  },
  newWelcomeSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    opacity: 0.8,
    lineHeight: 16,
  },
  newMenuSection: {
    paddingHorizontal: 20,
  },
  newMenuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  newMenuItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 120,
    justifyContent: 'center',
  },
  newMenuIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newMenuText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: theme.text,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: theme.textLight,
    textAlign: 'center',
    lineHeight: 14,
  },
  bottomSpacing: {
    height: 100,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: theme.tabBackground,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    marginTop: 4,
    color: theme.tabInactive,
  },
  activeLabel: {
    color: theme.tabActive,
    fontFamily: 'Nunito_700Bold',
  },
  
  topBarHeader: {
    backgroundColor: theme.headerBackground,
    paddingTop: Platform.OS === 'android' ? 8 : 6,
    paddingBottom: 8,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    overflow: 'hidden',
    zIndex: 1000,
    position: 'relative',
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    backgroundColor: theme.headerBackground,
    overflow: 'hidden',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIcon: {
    marginRight: 10,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  welcomeSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
  },
  welcomeTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: theme.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: theme.textLight,
    lineHeight: 20,
  },
  
  todayScheduleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: theme.text,
    marginLeft: 8,
  },
  schedulePreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  schedulePreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  schedulePreviewText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: theme.text,
    flex: 1,
  },
  
  quickInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickInfoItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  quickInfoText: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    color: theme.text,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
  },
  
  profilePhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  defaultProfileIcon: {
    marginRight: 10,
  },
  defaultProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#0d1117',
    marginLeft: 12,
    flex: 1,
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#4b5563',
    marginBottom: 8,
    lineHeight: 22,
  },
  modalSubtext: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#6b7280',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalConfirmText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
  },
  
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Nunito_700Bold',
  },
  
  // Teaching Schedule Styles
  headerInfo: {
    backgroundColor: theme.card,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: theme.text,
    marginBottom: 4,
  },
  
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: theme.textLight,
  },
  
  scheduleContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  dayCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  
  dayTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  
  scheduleItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  
  timeContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  jamText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: theme.primary,
  },
  
  timeText: {
    fontSize: 10,
    fontFamily: 'Nunito_400Regular',
    color: theme.textLight,
    textAlign: 'center',
  },
  
  scheduleDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  
  subjectText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: theme.text,
    marginBottom: 2,
  },
  
  classText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: theme.textLight,
    marginBottom: 1,
  },
  
  roomText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: theme.textLight,
  },
  
  noScheduleText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: theme.textLight,
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  
  // Classes Managed Styles
  classesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  classCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  
  className: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
  },
  
  waliKelasBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  waliKelasText: {
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
    color: '#FFFFFF',
  },
  
  classInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  infoText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: theme.text,
    marginLeft: 8,
  },
  
  subjectsSection: {
    padding: 16,
  },
  
  subjectsTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: theme.text,
    marginBottom: 8,
  },
  
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  
  subjectTag: {
    backgroundColor: theme.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  
  subjectTagText: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    color: theme.primary,
  },
  
  // Publication Status Styles
  publicationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  
  publicationStatusText: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#F59E0B',
    marginLeft: 4,
  },
  
  statusContainer: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
  },
  
  publishedBadge: {
    backgroundColor: '#10B981',
  },
  
  statusText: {
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
    color: '#fff',
    marginLeft: 3,
  },
  
  unpublishedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  
  unpublishedText: {
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    color: '#F59E0B',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
});
