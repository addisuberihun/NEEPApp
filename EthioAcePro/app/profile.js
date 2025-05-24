import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { api } from './api'; // Import the API client correctly
import { API_BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { loadLanguage } from '../src/locales/index';
const ProfileScreen = () => {
  const { user, logout, loading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default profile picture
  const defaultProfilePic = require('../assets/images/favicon.png');

  // Fetch student profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);

        // Get userId from AsyncStorage
        const userId = await AsyncStorage.getItem('userId');

        if (!userId) {
          console.log('User ID not found in AsyncStorage - user likely logged out');
          setIsLoading(false);
          // If we're on the profile page but no userId exists, redirect to login
          router.replace('/(auth)/login');
          return;
        }

        console.log('Fetching profile for user ID:', userId);

        // Try the endpoint that matches your backend API
        // Option 1: Using ID in URL
        const response = await api.get(`/api/v1/students/${userId}`);

        // If we get here, the request was successful
        console.log('Profile data received:', response);

        // Transform backend data to match expected format
        setProfileData({
          name: response.name || 'Unknown User',
          email: response.email || 'No email provided',
          studentId: 'ACE' + String(userId).slice(-6) || 'N/A',
          status: response.status || 'Active',
          level: response.level || 'Student',
          joinDate: response.createdAt ? new Date(response.createdAt).toLocaleDateString() : 'N/A',
          profilePic: response.profilePicture
            ? { uri: `${API_BASE_URL}/${response.profilePicture.replace(/^\//, '')}` }
            : defaultProfilePic,
          badges: response.badges || [
            { id: 1, name: 'Top Performer', icon: 'trophy', color: '#FFD700' },
            { id: 2, name: 'Fast Learner', icon: 'bolt', color: '#FFA500' },
            { id: 3, name: 'Perfect Attendance', icon: 'calendar-check', color: '#32CD32' },
          ],
          medals: response.medals || [
            { id: 1, type: 'gold', count: 0 },
            { id: 2, type: 'silver', count: 0 },
            { id: 3, type: 'bronze', count: 0 },
          ],
          stats: response.stats || {
            examsTaken: 0,
            averageScore: 0,
            rank: 'N/A',
          },
        });
      } catch (err) {
        console.error('Error fetching profile:', err);

        // Check if the error is due to authentication
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          // If unauthorized, redirect to login
          router.replace('/(auth)/login');
          return;
        }

        setError(`Failed to load profile data: ${err.message}`);

        // Set default profile data on error
        setProfileData({
          name: user?.name || 'Unknown User',
          email: user?.email || 'No email provided',
          studentId: 'N/A',
          status: 'Active',
          level: 'Student',
          joinDate: 'N/A',
          profilePic: defaultProfilePic,
          badges: [
            { id: 1, name: 'Top Performer', icon: 'trophy', color: '#FFD700' },
            { id: 2, name: 'Fast Learner', icon: 'bolt', color: '#FFA500' },
            { id: 3, name: 'Perfect Attendance', icon: 'calendar-check', color: '#32CD32' },
          ],
          medals: [
            { id: 1, type: 'gold', count: 0 },
            { id: 2, type: 'silver', count: 0 },
            { id: 3, type: 'bronze', count: 0 },
          ],
          stats: {
            examsTaken: 0,
            averageScore: 0,
            rank: 'N/A',
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading) {
      fetchProfile();
    }
  }, [user, loading, router]);


  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // After logout, immediately redirect to login screen
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, try to redirect to login
      router.replace('/(auth)/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setIsLoading(true) && setError(null) && fetchProfile()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render profile data
  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profilePicContainer}>
          <Image source={profileData.profilePic} style={styles.profilePic} />
          <TouchableOpacity style={styles.editIcon}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{profileData.name}</Text>
        <Text style={styles.userEmail}>{profileData.email}</Text>

        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: profileData.status === 'Active' ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.statusText}>{profileData.status} Student</Text>
        </View>
      </View>

      {/* Student Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <MaterialIcons name="fingerprint" size={24} color="#555" />
          <Text style={styles.infoText}>Student ID: {profileData.studentId}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="school" size={24} color="#555" />
          <Text style={styles.infoText}>Level: {profileData.level}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="date-range" size={24} color="#555" />
          <Text style={styles.infoText}>Member since: {profileData.joinDate}</Text>
        </View>

        {/* Stream Link */}
        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => router.push('/student/stream')}
        >
          <Ionicons name="git-branch" size={24} color="#555" />
          <Text style={styles.infoText}>Stream: {profileData.stream || 'Natural'}</Text>
          <Ionicons name="chevron-forward" size={20} color="#555" style={styles.linkArrow} />
        </TouchableOpacity>

        {/* Language Link */}
        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => router.push('/Stream/language')}
        >
          <Ionicons name="language" size={24} color="#555" />
          <Text style={styles.infoText}>Language: English</Text>
          <Ionicons name="chevron-forward" size={20} color="#555" style={styles.linkArrow} />
        </TouchableOpacity>
      </View>

      {/* Badges Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievement Badges</Text>
        <View style={styles.badgesContainer}>
          {profileData.badges.map(badge => (
            <View key={badge.id} style={styles.badge}>
              <FontAwesome5 name={badge.icon} size={24} color={badge.color} />
              <Text style={styles.badgeText}>{badge.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Medals Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medals</Text>
        <View style={styles.medalsContainer}>
          <View style={styles.medal}>
            <FontAwesome5 name="medal" size={30} color="#FFD700" />
            <Text style={styles.medalCount}>{profileData.medals[0].count} Gold</Text>
          </View>
          <View style={styles.medal}>
            <FontAwesome5 name="medal" size={30} color="#C0C0C0" />
            <Text style={styles.medalCount}>{profileData.medals[1].count} Silver</Text>
          </View>
          <View style={styles.medal}>
            <FontAwesome5 name="medal" size={30} color="#CD7F32" />
            <Text style={styles.medalCount}>{profileData.medals[2].count} Bronze</Text>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Stats</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileData.stats.examsTaken}</Text>
            <Text style={styles.statLabel}>Exams Taken</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileData.stats.averageScore}%</Text>
            <Text style={styles.statLabel}>Average Score</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileData.stats.rank}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          disabled={isLoggingOut}
        >
          <Text style={styles.logoutText}>{isLoggingOut ? 'Logging Out...' : 'Logout'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4285f4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePicContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4285f4',
  },
  editIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#4285f4',
    borderRadius: 20,
    padding: 6,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#555',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badge: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  medalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  medal: {
    alignItems: 'center',
  },
  medalCount: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '30%',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4285f4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    marginTop: 30,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonDisabled: {
    backgroundColor: '#f87171',
    opacity: 0.7,
  },
  logoutText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  linkArrow: {
    marginLeft: 'auto',
  },
});

export default ProfileScreen;



