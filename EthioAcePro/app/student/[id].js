
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Link, useNavigation, useRouter, useLocalSearchParams } from 'expo-router';
import * as Progress from 'react-native-progress';
import ProfileScreen from '../profile';
import { api } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const AuthenticatedHome = () => {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerWidth = width * 0.75;
  const [drawerAnim] = useState(new Animated.Value(-drawerWidth));
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [lastAccess, setLastAccess] = useState({
    subject: 'Loading...',
    grade: '',
    percentComplete: 0,
    resourceId: null,
    lastPosition: null
  });
  const [lastExam, setLastExam] = useState({
    name: 'Loading...',
    percentComplete: 0,
    resourceId: null,
    subject: '',
    year: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if the route param id matches the logged-in user's id
    if (params.id && user?._id && params.id !== user._id) {
      // If not matching, redirect to the logged-in user's page
      router.replace(`/student/${user._id}`);
    }
  }, [params.id, user, router]);

  // Fetch last accessed data
  useEffect(() => {
    const fetchLastAccessed = async () => {
      try {
        setLoading(true);
        
        // Check if the API endpoint is available
        try {
          const response = await api.get('/api/v1/user-activity/latest');
          
          if (response.success && response.data) {
            // Process course activity
            const courseActivity = response.data.find(a => a.activityType === 'course_accessed');
            if (courseActivity && courseActivity.metadata) {
              setLastAccess({
                subject: courseActivity.metadata.subject || 'Unknown',
                grade: courseActivity.metadata.grade || '',
                percentComplete: courseActivity.metadata.percentComplete || 0,
                resourceId: courseActivity.resourceId,
                lastPosition: courseActivity.metadata.lastPosition
              });
            }
            
            // Process exam activity
            const examActivity = response.data.find(a => a.activityType === 'exam_accessed');
            if (examActivity && examActivity.metadata) {
              setLastExam({
                name: examActivity.metadata.name || `${examActivity.metadata.subject}-${examActivity.metadata.year}`,
                percentComplete: examActivity.metadata.percentComplete || 0,
                resourceId: examActivity.resourceId,
                subject: examActivity.metadata.subject,
                year: examActivity.metadata.year
              });
            }
          } else {
            throw new Error('No activity data found');
          }
        } catch (apiError) {
          console.error('Error fetching from API:', apiError);
          
          // Use default data if API fails
          console.log('Using default data due to API error');
          setLastAccess({
            subject: 'Biology',
            grade: 'Grade 9',
            percentComplete: 0.6,
            resourceId: '60a1b2c3d4e5f6a7b8c9d0e1', // Dummy ID
            lastPosition: null
          });
          
          setLastExam({
            name: 'Physics-2016',
            percentComplete: 0.4,
            resourceId: '60a1b2c3d4e5f6a7b8c9d0e2', // Dummy ID
            subject: 'Physics',
            year: '2016'
          });
        }
      } catch (error) {
        console.error('Error in fetchLastAccessed:', error);
        
        // Use default data on any error
        setLastAccess({
          subject: 'Biology',
          grade: 'Grade 9',
          percentComplete: 0.6,
          resourceId: '60a1b2c3d4e5f6a7b8c9d0e1', // Dummy ID
          lastPosition: null
        });
        
        setLastExam({
          name: 'Physics-2016',
          percentComplete: 0.4,
          resourceId: '60a1b2c3d4e5f6a7b8c9d0e2', // Dummy ID
          subject: 'Physics',
          year: '2016'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchLastAccessed();
  }, []);

  // Handle continue course button
  const handleContinueCourse = () => {
    if (!lastAccess.resourceId) {
      Alert.alert('No course data', 'You have not accessed any courses yet.');
      return;
    }
    
    // Navigate to the course page
    if (lastAccess.lastPosition) {
      const [unitId, topicId] = lastAccess.lastPosition.split('/');
      router.push({
        pathname: `/subjects/topic`,
        params: { 
          unitId, 
          topicId, 
          subject: lastAccess.subject, 
          grade: lastAccess.grade
        }
      });
    } else {
      // If no specific position, just go to the course page
      router.push({
        pathname: `/subjects/course`,
        params: { 
          subject: lastAccess.subject, 
          grade: lastAccess.grade
        }
      });
    }
  };

  // Handle continue exam button
  const handleContinueExam = () => {
    if (!lastExam.resourceId) {
      Alert.alert('No exam data', 'You have not accessed any exams yet.');
      return;
    }
    
    // Navigate to the exam page
    router.push({
      pathname: `/entrancequestions/questions`,
      params: { 
        subject: lastExam.subject, 
        year: lastExam.year
      }
    });
  };

  // Add safe navigation handler for the home icon
  const handleHomeNavigation = () => {
    // Navigate to a safe route that doesn't require parameters
    router.replace('/student');
  };

  const toggleDrawer = () => {
    if (drawerOpen) {
      Animated.timing(drawerAnim, {
        toValue: -drawerWidth,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start(() => setDrawerOpen(false));
    } else {
      setDrawerOpen(true);
      Animated.timing(drawerAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
  };

  // Set custom header button for drawer toggle
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity style={styles.drawerToggle} onPress={toggleDrawer}>
          <Text style={styles.drawerToggleText}>☰</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, drawerOpen]);

  return (
    <View style={styles.container}>
      {/* Drawer */}
      {drawerOpen && (
        <TouchableOpacity style={styles.overlay} onPress={toggleDrawer} activeOpacity={1} />
      )}
      <Animated.View style={[styles.drawer, { width: drawerWidth, left: drawerAnim }]}>
        <ProfileScreen />
      </Animated.View>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Welcome, {user?.name} 👋</Text>
          <Text style={styles.subtext}>Ready to level up your exam prep today?</Text>
        </View>

        {/* Top Performers */}
        <Text style={styles.sectionTitle}>Top Performers</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.performersRow}>
          <Link href="/tabs/leaderboard" asChild>
            <Pressable style={styles.performerCircleWrapper}>
              {topPerformers.map((image, index) => (
                <Image key={index} source={image} style={styles.performerCircle} />
              ))}
            </Pressable>
          </Link>
        </ScrollView>

        {/* Continue Where You Left */}
        <Text style={styles.sectionTitle}>Continue Where You Left Off</Text>
        <View style={styles.continueCard}>
          <Text style={styles.cardTitle}>{`${lastAccess.subject}/${lastAccess.grade}`}</Text>
          <Progress.Bar
            progress={lastAccess.percentComplete}
            width={width * 0.75}
            color="#3b82f6"
            style={styles.progressBar}
          />
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinueCourse}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>

        {/* Last Accessed Exam */}
        <Text style={styles.sectionTitle}>Last Accessed Exam</Text>
        <View style={styles.continueCard}>
          <Text style={styles.cardTitle}>{lastExam.name}</Text>
          <Progress.Bar
            progress={lastExam.percentComplete}
            width={width * 0.75}
            color="#10b981"
            style={styles.progressBar}
          />
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinueExam}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Cards */}
        <Text style={styles.sectionTitle}>Explore</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          <Link href="../student/courses" asChild>
            <TouchableOpacity>
              <Card
                title="Courses"
                description="Start learning with structured lessons"
                image={require('../../assets/images/courses.jpg')}
              />
            </TouchableOpacity>
          </Link>

          <Link href="../student/exams" asChild>
            <TouchableOpacity>
              <Card
                title="Quizzes"
                description="Test your knowledge and track progress"
                image={require('../../assets/images/exam-preparation.jpg')}
              />
            </TouchableOpacity>
          </Link>
          <Link href="/student/exams" asChild>
            <TouchableOpacity>
              <Card
                title="Entrance Exams"
                description="Prepare for national exams with practice tests"
                image={require('../../assets/images/exam-preparation.jpg')}
              />
            </TouchableOpacity>
          </Link>
          <Link href="/student/chatroom" asChild>
            <TouchableOpacity>
              <Card
                title="Chatrooms"
                description="Connect with peers and instructors"
                image={require('../../assets/images/chatrooms.png')}
              />
            </TouchableOpacity>
          </Link>
        </ScrollView>

      </ScrollView>
    </View>
  );
};

const Card = ({ title, description, image }) => (
  <View style={styles.card}>
    <Image source={image} style={styles.cardImage} resizeMode="cover" />
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDescription}>{description}</Text>
  </View>
);

const topPerformers = [
  require('../../assets/images/courses.jpg'),
  require('../../assets/images/courses.jpg'),
  require('../../assets/images/courses.jpg'),
  require('../../assets/images/courses.jpg'),
  require('../../assets/images/courses.jpg'),
];

const lastAccess = {
  subject: 'Biology',
  grade: 'Grade 9',
  percentComplete: 0.6,
};

const lastExam = {
  name: 'Physics-2016',
  percentComplete: 0.4,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 2000, // Ensure drawer is above header and content
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1500, // Overlay below drawer but above content
  },
  drawerToggle: {
    padding: 10,
    marginLeft: 10,
  },
  drawerToggleText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  greetingContainer: {
    padding: 20,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  subtext: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  performersRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  performerCircleWrapper: {
    flexDirection: 'row',
    gap: 10,
  },
  performerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  continueCard: {
    backgroundColor: '#f1f9ff',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  progressBar: {
    marginTop: 10,
  },
  continueButton: {
    marginTop: 12,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 10,
  },
  continueText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  horizontalScroll: {
    paddingHorizontal: 15,
    paddingBottom: 18,
  },
  card: {
    width: width * 0.65,
    height: 280,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardImage: {
    width: '100%',
    height: 130,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e40af',
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
  },
  footer: {
    marginTop: 30,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  profileButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  profileText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AuthenticatedHome;




