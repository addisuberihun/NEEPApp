import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Dimensions,
  Platform,
  Animated,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';
//import { bulkSave } from '../../../backend/model/teacherRegisterModel';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: ' #3b82f6',
  secondary: ' #60a5fa',
  background: ' #f8fafc',
  card: '#ffffff',
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    light: '#94a3b8',
    white: '#ffffff',
  },
  unit: {
    1: ['#4ade80', '#22c55e'],
    2: ['#facc15', '#eab308'],
    3: ['#f87171', '#ef4444'],
    4: ['#60a5fa', '#3b82f6'],
    5: ['#a78bfa', '#8b5cf6'],
  },
  video: ['#3b82f6', '#2563eb'],
  quiz: ['#f97316', '#ea580c'],
  progress: {
    completed: '#22c55e',
    incomplete: '#e2e8f0',
    track: '#f1f5f9',
  },
  topic: {
    completed: '#22c55e',
    incomplete: '#cbd5e1',
  },
  note: {
    background: '#f8fafc',
    border: '#e2e8f0',
  }
};

const CourseView = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [expandedUnit, setExpandedUnit] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showTopicDetails, setShowTopicDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [courseData, setCourseData] = useState(null);
  const [error, setError] = useState(null);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(width)).current;
  const mainContentOpacity = useRef(new Animated.Value(1)).current;

  // Get grade and subject from params
  const grade = params?.grade;
  const subject = params?.subject;
  
  // Create a cache key for this course
  const cacheKey = `course_${grade}_${subject}`;
  
  // Fetch course data from API
  useEffect(() => {
    if (!grade || !subject) {
      setError('Missing grade or subject information');
      Alert.alert('Error', 'Missing required information');
      router.back();
      return;
    }
    
    fetchCourseData();
  }, [grade, subject]);
  
  const fetchCourseData = async () => {
    try {
      setIsLoading(true);
      
      // Always try to fetch fresh data from API first
      try {
        // Convert subject to lowercase to match database format
        const subjectLowercase = subject.toLowerCase();
        
        // Use the correct API endpoint format with the /api/v1 prefix
        const endpoint = `/api/v1/notes?subject=${encodeURIComponent(subjectLowercase)}&grade=${encodeURIComponent(grade)}`;
        console.log(`Fetching fresh course data from: ${endpoint}`);
        
        // Fetch course structure from the backend
        const response = await api.get(endpoint);
        console.log('API Response:', response);
        
        if (response && Array.isArray(response) && response.length > 0) {
          console.log(`Found ${response.length} notes from API`);
          
          // Log all chapters to debug
          const chapters = response.map(note => note.chapter);
          console.log('All chapters in response:', chapters);
          
          // Group notes by chapter
          const notesByChapter = {};
          
          response.forEach(note => {
            // Ensure chapter is a string and has a value
            const chapter = note.chapter ? note.chapter.toString() : "1";
            if (!notesByChapter[chapter]) {
              notesByChapter[chapter] = [];
            }
            notesByChapter[chapter].push(note);
          });
          
          console.log('Chapters after grouping:', Object.keys(notesByChapter));
          console.log('Notes count per chapter:', Object.keys(notesByChapter).map(ch => 
            `Chapter ${ch}: ${notesByChapter[ch].length} notes`
          ));
          
          // Transform the data to match our expected format
          const transformedData = {
            grade: grade,
            subject: subject,
            units: Object.keys(notesByChapter).map(chapter => ({
              id: chapter,
              title: `${subject} Chapter ${chapter}`,
              description: `Chapter ${chapter} content`,
              progress: 0,
              topics: notesByChapter[chapter].map(note => ({
                id: note._id || `${chapter}_${note.title}`,
                title: note.title || `Topic`,
                completed: false,
                description: note.description || "",
                videoTutorials: [],
                quizzes: [],
                notes: note.description || ""
              }))
            }))
          };
          
          // Sort units by chapter number
          transformedData.units.sort((a, b) => {
            const chapterA = parseInt(a.id) || 0;
            const chapterB = parseInt(b.id) || 0;
            return chapterA - chapterB;
          });
          
          console.log(`Transformed data has ${transformedData.units.length} units`);
          transformedData.units.forEach(unit => {
            console.log(`Unit ${unit.id} has ${unit.topics.length} topics`);
          });
          
          // Save to AsyncStorage for offline access
          await AsyncStorage.setItem(cacheKey, JSON.stringify(transformedData));
          
          setCourseData(transformedData);
          setIsLoading(false);
          return;
        } else {
          console.log('API returned empty data, checking cache');
        }
      } catch (apiError) {
        console.error('API fetch failed:', apiError);
        console.log('Falling back to cache due to API error');
      }
      
      // If API fetch failed or returned empty, try to get from AsyncStorage
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        console.log('Using cached course data from AsyncStorage');
        const parsedData = JSON.parse(cachedData);
        setCourseData(parsedData);
      } else {
        setError('No course data available');
        Alert.alert('No Data', `No course content found for ${subject} in Grade ${grade}.`);
        router.back();
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      setError(`An unexpected error occurred: ${error.message}`);
      Alert.alert('Error', 'Failed to load course data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to calculate unit progress based on completed topics
  const calculateUnitProgress = (topics) => {
    if (!topics || topics.length === 0) return 0;
    
    const completedTopics = topics.filter(topic => topic.completed).length;
    return completedTopics / topics.length;
  };
  
  // Add this function to track course activity
  const trackCourseActivity = async (courseData, unitId, topicId) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      // Calculate overall course progress
      const totalTopics = courseData.units.reduce((sum, unit) => sum + unit.topics.length, 0);
      const completedTopics = courseData.units.reduce((sum, unit) => 
        sum + unit.topics.filter(topic => topic.completed).length, 0);
      const percentComplete = totalTopics > 0 ? completedTopics / totalTopics : 0;

      // Find the current unit and topic
      const currentUnit = courseData.units.find(unit => unit.id === unitId);
      const currentTopic = currentUnit?.topics.find(topic => topic.id === topicId);

      const activityData = {
        activityType: 'course_accessed',
        resourceId: courseData._id || `${courseData.subject}-${courseData.grade}`,
        resourceType: 'course',
        metadata: {
          subject: courseData.subject,
          grade: courseData.grade,
          name: `${courseData.subject}/${courseData.grade}`,
          percentComplete: percentComplete,
          lastPosition: `${unitId}/${topicId}`
        }
      };

      await api.post('/api/v1/user-activity', activityData);
      console.log('Course activity tracked successfully');
    } catch (error) {
      console.error('Error tracking course activity:', error);
      // Don't throw - this is a non-critical operation
    }
  };

  // Update the markTopicComplete function
  const markTopicComplete = async (unitId, topicId) => {
    try {
      // Update locally first for immediate UI feedback
      const updatedCourseData = {
        ...courseData,
        units: courseData.units.map(unit => {
          if (unit.id === unitId) {
            return {
              ...unit,
              topics: unit.topics.map(topic => {
                if (topic.id === topicId) {
                  return { ...topic, completed: true };
                }
                return topic;
              }),
              progress: calculateUnitProgress(unit.topics.map(topic => {
                if (topic.id === topicId) {
                  return { ...topic, completed: true };
                }
                return topic;
              }))
            };
          }
          return unit;
        })
      };
      
      setCourseData(updatedCourseData);
      
      // Save updated data to AsyncStorage
      await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedCourseData));
      
      // Track course activity
      await trackCourseActivity(updatedCourseData, unitId, topicId);
      
      // Send update to backend
      await api.post(`/api/v1/notes/progress`, {
        grade,
        subject,
        unitId,
        topicId,
        completed: true
      });
    } catch (error) {
      console.error('Error marking topic complete:', error);
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  const toggleUnit = (unitId) => {
    if (expandedUnit === unitId) {
      setExpandedUnit(null);
    } else {
      setExpandedUnit(unitId);
    }
  };

  const showTopicDetailsScreen = (unitId, topicId) => {
    if (!courseData) return;
    
    const unit = courseData.units.find(u => u.id === unitId);
    const topic = unit.topics.find(t => t.id === topicId);
    setSelectedTopic({ ...topic, unitId });
    
    // Animate transition
    setShowTopicDetails(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(mainContentOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  const hideTopicDetailsScreen = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(mainContentOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowTopicDetails(false);
      setSelectedTopic(null);
    });
  };

  const renderProgressBar = (progress) => {
    return Platform.OS === 'ios' ? (
      <Progress.Bar 
        progress={progress} 
        width={null} 
        height={8}
        color={COLORS.progress.completed}
        unfilledColor={COLORS.progress.track}
        borderWidth={0}
        borderRadius={4}
        style={styles.progressBar}
      />
    ) : (
      <View style={styles.androidProgressContainer}>
        <View style={[styles.androidProgressBar, {width: `${progress * 100}%`}]} />
      </View>
    );
  };

  // Add this function to navigate between topics
  const navigateToTopic = (direction) => {
    if (!selectedTopic || !courseData) return;
    
    const currentUnit = courseData.units.find(u => u.id === selectedTopic.unitId);
    const currentTopicIndex = currentUnit.topics.findIndex(t => t.id === selectedTopic.id);
    
    if (direction === 'next') {
      // If there's a next topic in the same unit
      if (currentTopicIndex < currentUnit.topics.length - 1) {
        const nextTopic = currentUnit.topics[currentTopicIndex + 1];
        setSelectedTopic({ ...nextTopic, unitId: currentUnit.id });
      } 
      // If we need to go to the first topic of the next unit
      else {
        const currentUnitIndex = courseData.units.findIndex(u => u.id === currentUnit.id);
        if (currentUnitIndex < courseData.units.length - 1) {
          const nextUnit = courseData.units[currentUnitIndex + 1];
          if (nextUnit.topics.length > 0) {
            const firstTopicOfNextUnit = nextUnit.topics[0];
            setSelectedTopic({ ...firstTopicOfNextUnit, unitId: nextUnit.id });
          }
        }
      }
    } else if (direction === 'previous') {
      // If there's a previous topic in the same unit
      if (currentTopicIndex > 0) {
        const prevTopic = currentUnit.topics[currentTopicIndex - 1];
        setSelectedTopic({ ...prevTopic, unitId: currentUnit.id });
      } 
      // If we need to go to the last topic of the previous unit
      else {
        const currentUnitIndex = courseData.units.findIndex(u => u.id === currentUnit.id);
        if (currentUnitIndex > 0) {
          const prevUnit = courseData.units[currentUnitIndex - 1];
          if (prevUnit.topics.length > 0) {
            const lastTopicOfPrevUnit = prevUnit.topics[prevUnit.topics.length - 1];
            setSelectedTopic({ ...lastTopicOfPrevUnit, unitId: prevUnit.id });
          }
        }
      }
    }
  };

  const renderTopicDetails = () => {
    if (!selectedTopic || !courseData) return null;
    
    const unit = courseData.units.find(u => u.id === selectedTopic.unitId);
    const unitColors = COLORS.unit[selectedTopic.unitId] || COLORS.unit[1];
    
    // Determine if we have previous/next topics
    const currentTopicIndex = unit.topics.findIndex(t => t.id === selectedTopic.id);
    const currentUnitIndex = courseData.units.findIndex(u => u.id === selectedTopic.unitId);
    
    const hasPrevious = currentTopicIndex > 0 || currentUnitIndex > 0;
    const hasNext = currentTopicIndex < unit.topics.length - 1 || currentUnitIndex < courseData.units.length - 1;
    
    return (
      <Animated.View 
        style={[
          styles.topicDetailsContainer, 
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        {/* Topic Details Header */}
        <LinearGradient
          colors={unitColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topicDetailsHeader}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={hideTopicDetailsScreen}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.topicDetailsTitle}>{selectedTopic.title}</Text>
            <Text style={styles.topicDetailsSubtitle}>
              {unit.title}
            </Text>
          </View>
        </LinearGradient>

        {/* Topic Details Content */}
        <ScrollView style={styles.topicDetailsContent}>
          <Text style={styles.topicDescription}>{selectedTopic.description}</Text>
          
          {/* Notes Section */}
          {selectedTopic.notes && (
            <View style={styles.noteContainer}>
              <View style={styles.noteHeader}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
                <Text style={styles.noteTitle}>Notes</Text>
              </View>
              <Text style={styles.noteText}>{selectedTopic.notes}</Text>
            </View>
          )}
          
          {/* Video Tutorials */}
          {selectedTopic.videoTutorials && selectedTopic.videoTutorials.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Video Tutorials</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.videosContainer}
              >
                {selectedTopic.videoTutorials.map((video) => (
                  <TouchableOpacity 
                    key={video.id} 
                    style={styles.videoCard}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={video.thumbnail ? { uri: video.thumbnail } : require('../../assets/images/courses.jpg')} 
                      style={styles.videoThumbnail} 
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
                      style={styles.videoOverlay}
                    >
                      <MaterialIcons name="play-circle-filled" size={40} color="#fff" />
                    </LinearGradient>
                    <View style={styles.videoInfo}>
                      <Text style={styles.videoTitle}>{video.title}</Text>
                      <Text style={styles.videoDuration}>{video.duration}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
          
          {/* Quizzes */}
          {selectedTopic.quizzes && selectedTopic.quizzes.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Quizzes</Text>
              <View style={styles.quizzesContainer}>
                {selectedTopic.quizzes.map((quiz) => (
                  <TouchableOpacity 
                    key={quiz.id} 
                    style={styles.quizCard}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={COLORS.quiz}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.quizGradient}
                    >
                      <View style={styles.quizInfo}>
                        <Text style={styles.quizTitle}>{quiz.title}</Text>
                        <Text style={styles.quizDetails}>
                          {quiz.questions} questions • {quiz.time}
                        </Text>
                      </View>
                      <View style={styles.quizIconContainer}>
                        <MaterialIcons name="assignment" size={28} color="#fff" />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          
          {/* Mark as Completed Button */}
          {!selectedTopic.completed && (
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={() => markTopicComplete(selectedTopic.unitId, selectedTopic.id)}
            >
              <LinearGradient
                colors={['#4ade80', '#22c55e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.completeButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.completeButtonText}>Mark as Completed</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {/* Navigation Arrows */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity 
              style={[styles.navButton, !hasPrevious && styles.navButtonDisabled]}
              onPress={() => navigateToTopic('previous')}
              disabled={!hasPrevious}
            >
              <Ionicons 
                name="arrow-back-circle" 
                size={28} 
                color={hasPrevious ? "#fff" : COLORS.text.light} 
              />
              <Text style={[styles.navText, !hasPrevious && styles.navTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.navButton, !hasNext && styles.navButtonDisabled]}
              onPress={() => navigateToTopic('next')}
              disabled={!hasNext}
            >
              <Text style={[styles.navText, !hasNext && styles.navTextDisabled]}>
                Next 
              </Text>
              <Ionicons 
                name="arrow-forward-circle" 
                size={28} 
                color={hasNext ? "rgb(6, 80, 165" : COLORS.text.secondary} 
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    );
  };

  // Loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading course content...</Text>
      </View>
    );
  }

  // Error state
  if (error || !courseData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#ef4444" />
        <Text style={styles.errorText}>{error || 'Failed to load course data'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchCourseData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <Animated.View style={{ flex: 1, opacity: mainContentOpacity }}>
        {/* Header */}
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Grade {courseData.grade} - {courseData.subject}
            </Text>
            <Text style={styles.headerSubtitle}>
              {courseData.units.length} Units • {courseData.units.reduce((total, unit) => 
                total + unit.topics.length, 0)} Topics
            </Text>
          </View>
        </LinearGradient>

        {/* Course Content */}
        <ScrollView style={styles.content}>
          {courseData.units.map((unit) => (
            <View key={unit.id} style={styles.unitContainer}>
              {/* Unit Header */}
              <TouchableOpacity 
                style={styles.unitHeader}
                onPress={() => toggleUnit(unit.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={COLORS.unit[unit.id] || COLORS.unit[1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.unitGradient}
                >
                  <View style={styles.unitTitleContainer}>
                    <Text style={styles.unitTitle}>{unit.title}</Text>
                    <Ionicons 
                      name={expandedUnit === unit.id ? "chevron-down" : "chevron-forward"} 
                      size={24} 
                      color="#fff" 
                    />
                  </View>
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                      {Math.round(unit.progress * 100)}% Complete
                    </Text>
                    {renderProgressBar(unit.progress)}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Unit Content (expanded) - Only show topics list */}
              {expandedUnit === unit.id && (
                <View style={styles.unitContent}>
                  <Text style={styles.unitDescription}>{unit.description}</Text>
                  
                  {/* Topics List */}
                  <Text style={styles.sectionTitle}>Topics</Text>
                  <View style={styles.topicsContainer}>
                    {unit.topics.map((topic) => (
                      <TouchableOpacity 
                        key={topic.id}
                        style={styles.topicItem}
                        onPress={() => showTopicDetailsScreen(unit.id, topic.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.checkboxContainer, 
                          {backgroundColor: topic.completed ? COLORS.topic.completed : 'transparent'}
                        ]}>
                          {topic.completed && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                        <Text style={[
                          styles.topicText,
                          topic.completed && styles.completedTopicText
                        ]}>
                          {topic.title}
                        </Text>
                        <Ionicons 
                          name="chevron-forward" 
                          size={24} 
                          color="#fff"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Topic Details Screen (slides in from right) */}
      {showTopicDetails && renderTopicDetails()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    
  },
  header: {
    paddingTop: 90,
    paddingBottom: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1, 
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  unitContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unitHeader: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  unitGradient: {
    padding: 12,
  },
  unitTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.white,
    flex: 1,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.text.white,
    marginBottom: 4,
  },
  progressBar: {
    width: '100%',
  },
  androidProgressContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  androidProgressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  unitContent: {
    padding: 16,
  },
  unitDescription: {
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  topicsContainer: {
    marginBottom: 20,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  checkboxContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.topic.completed,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    flex: 1,
  },
  completedTopicText: {
    color: COLORS.text.light,
  },
  
  // Topic Details Screen Styles
  topicDetailsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  topicDetailsHeader: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicDetailsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text.white,
  },
  topicDetailsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  topicDetailsContent: {
    flex: 1,
    padding: 16,
  },
  topicDescription: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
  noteContainer: {
    backgroundColor: COLORS.note.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.note.border,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  noteText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 22,
    textAlign: 'justify',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  videosContainer: {
    paddingBottom: 8,
  },
  videoCard: {
    width: width * 0.7,
    height: 160,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.white,
  },
  videoDuration: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  quizzesContainer: {
    marginBottom: 8
  },
  quizCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quizGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.white,
  },
  quizDetails: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  quizIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  topicContent: {
    backgroundColor: COLORS.note.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topicDescription: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  noteContainer: {
    backgroundColor: COLORS.note.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.note.border,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  noteText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12,
  },

  navButtonDisabled: {
    backgroundColor: '#e2e8f0', // Lighter color for disabled state
  },
  navText: {
    fontSize: 16,
    fontWeight: '600', // Semi-bold text
    color: 'black', // White text for better contrast
    marginHorizontal: 8, // Add horizontal margin for spacing from icon
  },
  navTextDisabled: {
    color: '#94a3b8', // Muted text color for disabled state
  },
  completeButton: {
    backgroundColor: '#4ade80',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completeButtonGradient: {
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeButton: {
    marginVertical: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 50,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    elevation: 2, // Keep for Android
    // Fix shadow properties for iOS
    // Use boxShadow instead of individual shadow properties
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
  },
  navButtonDisabled: {
    backgroundColor: COLORS.text.light,
  },
  navText: {
    fontSize: 16,
    color: COLORS.text.white,
    marginRight: 8,
  },
  navTextDisabled: {
    color: COLORS.text.light,
  },
});

export default CourseView;



























