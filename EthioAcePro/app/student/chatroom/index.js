import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  AppState
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ChatRoomList = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [userStream, setUserStream] = useState('Natural'); // Default to Natural
  const router = useRouter();

  useEffect(() => {
    const initializeComponent = async () => {
      await fetchUserStream();
      await fetchChatRooms();
    };
    
    initializeComponent();
  }, []);

  // Fetch user's stream from AsyncStorage
  const fetchUserStream = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.stream) {
          setUserStream(user.stream);
          console.log('User stream loaded:', user.stream);
        } else {
          console.log('User has no stream defined in AsyncStorage');
        }
      } else {
        console.log('No user data found in AsyncStorage');
        // Check if we need to redirect to login
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to login');
          router.replace('/(auth)/login');
        }
      }
    } catch (error) {
      console.error('Error fetching user stream:', error);
    }
  };

  // Filter chat rooms based on user's stream
  useEffect(() => {
    if (chatRooms.length > 0) {
      filterRoomsByStream();
    }
  }, [chatRooms, userStream]);

  const filterRoomsByStream = () => {
    // Define subjects for each stream
    const naturalSubjects = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Natural Science'];
    const socialSubjects = ['Geography', 'History', 'Economics', 'Social Science'];
    const commonSubjects = ['English', 'Aptitude', 'General'];

    // Determine which subjects to include based on user's stream
    const relevantSubjects = userStream === 'Natural' 
      ? [...naturalSubjects, ...commonSubjects]
      : [...socialSubjects, ...commonSubjects];

    // Filter rooms based on subject
    const filtered = chatRooms.filter(room => {
      // If room has no subject, include it for everyone
      if (!room.subject) return true;
      
      // Check if room's subject is relevant for user's stream
      return relevantSubjects.some(subject => 
        room.subject.toLowerCase().includes(subject.toLowerCase())
      );
    });

    setFilteredRooms(filtered);
  };

  const fetchChatRooms = async () => {
    setLoadingRooms(true);
    setNetworkError(false);
    
    try {
      // First check if we have a token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No token found, cannot fetch chat rooms');
        setNetworkError(true);
        
        // Use demo data in development mode
        if (__DEV__) {
          console.log('Using demo chat rooms data (no token)');
          setChatRooms(getDemoChatRooms());
        }
        return;
      }
      
      console.log('Fetching chat rooms with token:', token.substring(0, 10) + '...');
      
      // Add a timeout to the API call
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const fetchPromise = api.get('/api/v1/chat/rooms');
      
      // Race between the API call and the timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (response && response.success) {
        console.log('Successfully fetched chat rooms:', response.data.length);
        setChatRooms(response.data);
      } else {
        console.warn('API returned unsuccessful response:', response);
        setNetworkError(true);
        
        // Use demo data if in development mode
        if (__DEV__) {
          console.log('Using demo chat rooms data (unsuccessful response)');
          setChatRooms(getDemoChatRooms());
        } else {
          Alert.alert('Error', 'Failed to load chat rooms');
        }
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      setNetworkError(true);
      
      // Use demo data in development mode or if we have a demo token
      const token = await AsyncStorage.getItem('token');
      if (__DEV__ || token === 'demo_token_123456') {
        console.log('Using demo chat rooms data (error)');
        setChatRooms(getDemoChatRooms());
      } else {
        Alert.alert('Error', 'Failed to load chat rooms. Please check your connection.');
      }
    } finally {
      setLoadingRooms(false);
    }
  };

  // Demo data function
  const getDemoChatRooms = () => {
    return [
      {
        _id: 'demo1',
        name: 'Mathematics Discussion',
        subject: 'Mathematics',
        description: 'Chat room for discussing mathematics problems and solutions',
        participants: Array(15).fill({}),
        createdAt: new Date().toISOString()
      },
      {
        _id: 'demo2',
        name: 'Physics Study Group',
        subject: 'Physics',
        description: 'Discuss physics concepts and problem-solving techniques',
        participants: Array(8).fill({}),
        createdAt: new Date().toISOString()
      },
      {
        _id: 'demo3',
        name: 'Chemistry Lab',
        subject: 'Chemistry',
        description: 'Chat about chemistry experiments and lab work',
        participants: Array(12).fill({}),
        createdAt: new Date().toISOString()
      },
      {
        _id: 'demo4',
        name: 'History Discussion',
        subject: 'History',
        description: 'Discuss historical events and their significance',
        participants: Array(10).fill({}),
        createdAt: new Date().toISOString()
      },
      {
        _id: 'demo5',
        name: 'Geography Study Group',
        subject: 'Geography',
        description: 'Study geographical concepts and maps',
        participants: Array(7).fill({}),
        createdAt: new Date().toISOString()
      },
      {
        _id: 'demo6',
        name: 'General Discussion',
        subject: 'General',
        description: 'General academic discussions and questions',
        participants: Array(25).fill({}),
        createdAt: new Date().toISOString()
      }
    ];
  };

  const handleRoomSelect = (room) => {
    // Navigate to the standalone chat room screen
    router.push({
      pathname: '/chatroom/[id]',
      params: { id: room._id, roomName: room.name }
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() => handleRoomSelect(item)}
    >
      <Text style={styles.roomName}>{item.name}</Text>
      {item.subject && (
        <View style={styles.subjectTag}>
          <Text style={styles.subjectText}>{item.subject}</Text>
        </View>
      )}
      <Text style={styles.roomDescription}>{item.description || 'No description'}</Text>
      <Text style={styles.participantsCount}>
        {item.participants?.length || 0} participants
      </Text>
    </TouchableOpacity>
  );

  if (loadingRooms) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat Rooms</Text>
        <View style={styles.streamIndicator}>
          <Text style={styles.streamText}>{userStream} Stream</Text>
        </View>
      </View>
      
      {networkError && (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={24} color="#e53e3e" />
          <Text style={styles.errorText}>Network connection issue. Showing demo data.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchChatRooms}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={filteredRooms}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshing={loadingRooms}
        onRefresh={fetchChatRooms}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No chat rooms available for your stream</Text>
            {networkError && renderRetryButton()}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  streamIndicator: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  streamText: {
    color: '#0369a1',
    fontWeight: '600',
    fontSize: 12,
  },
  listContent: {
    padding: 16,
  },
  roomItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subjectTag: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
  },
  roomDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  participantsCount: {
    fontSize: 12,
    color: '#2563eb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fed7d7',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  errorText: {
    color: '#e53e3e',
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ChatRoomList;




