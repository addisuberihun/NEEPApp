import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { api } from '../api';
import { Stack } from 'expo-router';

// Add a simple console log at the top of the file to confirm it's being loaded
console.log('QuestionView component loaded');

// Simple in-memory cache
const questionsCache = {};

const QuestionView = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  
  useEffect(() => {
    console.log('Navigation State:', navigation.getState());
    console.log('Parent Navigator:', navigation.getParent()?.getState());
  }, []);

  // Destructure year and subject from params
  const year = params?.year;
  const subject = params?.subject;

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    console.log('Year:', year, 'Subject:', subject); // Debug log
  }, [year, subject]);

  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [explanationsVisible, setExplanationsVisible] = useState({});
  const [timer, setTimer] = useState(60 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCorrectImmediately, setShowCorrectImmediately] = useState(false);

  const timerRef = useRef(null);
  const cacheKey = `${year}-${subject}`;

  const convertLetterToIndex = (letter) => {
    const mapping = { 'A': '0', 'B': '1', 'C': '2', 'D': '3' };
    return mapping[letter] || letter;
  };

  // Add this function to handle safe navigation
  const safeGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If can't go back, go to a safe screen
      router.replace('/student');
    }
  };

  // Add this function to track exam activity
  const trackExamActivity = async (examData, percentComplete = 0) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const activityData = {
        activityType: 'exam_accessed',
        resourceId: examData._id || examData.id || `${examData.subject}-${examData.year}`,
        resourceType: 'entrance_exam',
        metadata: {
          subject: examData.subject,
          year: examData.year,
          name: `${examData.subject}-${examData.year}`,
          percentComplete: percentComplete,
          lastPosition: currentQuestionIndex !== undefined ? currentQuestionIndex.toString() : '0'
        }
      };

      await api.post('/api/v1/user-activity', activityData);
      console.log('Exam activity tracked successfully');
    } catch (error) {
      console.error('Error tracking exam activity:', error);
      // Don't throw - this is a non-critical operation
    }
  };

  useEffect(() => {
    // Check if required params are missing
    if (!year || !subject) {
      console.error('Missing required params:', { year, subject });
      setHasError(true);
      
      // Use setTimeout to delay the navigation until after component mount
      const timer = setTimeout(() => {
        Alert.alert('Error', 'Missing required information', [
          { text: 'OK', onPress: () => {
            // Navigate back safely or to a default screen
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              // If can't go back, go to a safe screen
              router.replace('/student');
            }
          }}
        ]);
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    // Check cache first
    if (questionsCache[cacheKey]) {
      console.log('Using cached questions');
      setQuestions(questionsCache[cacheKey]);
      setIsLoading(false);
      startTimer();
    } else {
      fetchQuestions();
    }
    
    return () => clearInterval(timerRef.current);
  }, [year, subject]);

  const fetchQuestions = async () => {
    try {
      console.log('Fetching questions for year:', year, 'subject:', subject); // Debug log
      
      // Try to get from AsyncStorage first
      const cachedData = await AsyncStorage.getItem(`questions_${cacheKey}`);
      
      // If not in AsyncStorage, fetch from API
      console.log('Making API request to:', `/api/v1/entrance/${subject}/${year}`); // Log endpoint
      try {
        const response = await api.get(`/api/v1/entrance/${subject}/${year}`);
        console.log('API Response:', response); // Debug response
        
        // Check if we got valid data
        if (response && Array.isArray(response) && response.length > 0) {
          const transformedQuestions = response.map(item => ({
            _id: item._id,
            questionText: item.question?.text || '',
            options: item.options?.map(o => o.text) || [],
            correctAnswer: item.correctAnswer,
            subject: item.subject,
            explanation: item.explanation || ''
          }));
          
          console.log('Transformed questions count:', transformedQuestions.length); // Debug count
          
          // Save to cache
          questionsCache[cacheKey] = transformedQuestions;
          
          // Save to AsyncStorage for persistence
          try {
            await AsyncStorage.setItem(`questions_${cacheKey}`, JSON.stringify(transformedQuestions));
          } catch (e) {
            console.error('Error saving to AsyncStorage:', e);
          }
          
          setQuestions(transformedQuestions);
          setIsLoading(false);
          startTimer();
          return;
        } else {
          console.log('API returned empty data, checking cache');
          // API returned empty data, try to use cache if available
          if (cachedData) {
            console.log('Using cached questions as fallback');
            const parsedData = JSON.parse(cachedData);
            questionsCache[cacheKey] = parsedData;
            setQuestions(parsedData);
            setIsLoading(false);
            startTimer();
            return;
          }
          
          // No cache and no API data
          console.log('No questions available from API or cache');
          Alert.alert('No Questions', `No questions found for ${subject} in ${year}.`);
          safeGoBack();
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // API error, try to use cache if available
        if (cachedData) {
          console.log('API error, using cached questions');
          const parsedData = JSON.parse(cachedData);
          questionsCache[cacheKey] = parsedData;
          setQuestions(parsedData);
          setIsLoading(false);
          startTimer();
          return;
        }
        
        // No cache and API error
        Alert.alert('Error', 'Failed to fetch questions. Please try again.');
        safeGoBack();
      }
    } catch (error) {
      console.error('Error in fetchQuestions:', error);
      Alert.alert('Error', 'Failed to fetch questions. Please try again.');
      safeGoBack();
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      startTimer();
    } else {
      clearInterval(timerRef.current);
    }
    setIsPaused(!isPaused);
  };

  const handleAnswerSelect = (questionId, selectedIndex) => {
    if (submitted || isPaused) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: selectedIndex,
    }));

    if (showCorrectImmediately) {
      // Optionally disable further changes for this question by not allowing changes after first selection
      // Could implement a separate state to track locked questions if needed
    }
  };

  const handleToggleExplanation = (questionId) => {
    setExplanationsVisible((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const saveScore = async (tempScore) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found');
      }

      const scoreData = {
        student: userId,
        year: year,
        score: tempScore,
        totalQuestions: questions.length,
        subject: subject, // Add the subject field
        submittedAt: new Date()
      };

      console.log('Saving score data:', scoreData); // Debug log
      try {
        const response = await api.post('/api/v1/score', scoreData);
        console.log('Score saved successfully:', response.data);
      } catch (networkError) {
        // Removed console.error to avoid logging network error for offline score saving
        // Save score locally for later sync
        const pendingScoresRaw = await AsyncStorage.getItem('pendingScores');
        const pendingScores = pendingScoresRaw ? JSON.parse(pendingScoresRaw) : [];
        pendingScores.push(scoreData);
        await AsyncStorage.setItem('pendingScores', JSON.stringify(pendingScores));
      }
    } catch (error) {
      console.error('Error saving score:', error);
      Alert.alert('Error', 'Failed to save score');
    }
  };

  const handleSubmitExam = () => {
    clearInterval(timerRef.current);
    let tempScore = 0;
    
    // Debug logging
    console.log('Selected Answers:', selectedAnswers);
    
    questions.forEach((q) => {
      const selected = selectedAnswers[q._id];
      const correctAnswerIndex = convertLetterToIndex(q.correctAnswer);
      
      console.log('Question:', q._id);
      console.log('Selected Answer:', selected);
      console.log('Correct Answer (original):', q.correctAnswer);
      console.log('Correct Answer (converted):', correctAnswerIndex);
      
      if (selected !== undefined && selected.toString() === correctAnswerIndex) {
        tempScore++;
      }
    });

    console.log('Final Score:', tempScore);
    setScore(tempScore);
    setSubmitted(true);
    setShowResultPopup(true);
    AsyncStorage.removeItem('examProgress');

    // Save score to backend
    saveScore(tempScore);

    // Track exam completion
    const examData = {
      _id: questions[0]?.examId || `${subject}-${year}`,
      subject,
      year
    };
    trackExamActivity(examData, tempScore / questions.length);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Function to handle "Try Again" with fresh data
  const handleTryAgain = () => {
    // Clear the cache for this specific exam to force a fresh fetch
    delete questionsCache[cacheKey];
    
    // Reset all states
    setSubmitted(false);
    setSelectedAnswers({});
    setScore(0);
    setTimer(60 * 1);
    setExplanationsVisible({});
    setIsLoading(true);
    
    // Fetch questions again
    fetchQuestions();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={safeGoBack}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}></Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{subject} - {year}</Text>
      </View>

      <View style={styles.customHeader}>
        <View style={styles.headerSection}>
          <MaterialCommunityIcons name="clock-outline" size={20} color="#fff" />
          <Text style={styles.headerText}>{formatTime(timer)}</Text>
        </View>

        <TouchableOpacity onPress={handlePauseResume} style={styles.headerSection}>
          <MaterialIcons
            name={isPaused ? 'play-arrow' : 'pause'}
            size={24}
            color="#fff"
          />
          <Text style={styles.headerText}>{isPaused ? 'Resume' : 'Pause'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmitExam}
          disabled={submitted}
          style={styles.headerSection}
        >
          <MaterialIcons name="check-circle" size={24} color="#fff" />
          <Text style={styles.headerText}>Submit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowCorrectImmediately(!showCorrectImmediately)}
          style={styles.headerSection}
        >
          <MaterialIcons
            name={showCorrectImmediately ? 'visibility-off' : 'visibility'}
            size={24}
            color="#fff"
          />
           
        </TouchableOpacity>
      </View>

      {/* Questions */}
      <ScrollView style={[
        styles.scrollContainer,
        showResultPopup && styles.blurredBackground
      ]}>
        {questions.map((question, qIndex) => (
          <View
            key={question._id}
            style={[
              styles.questionContainer,
              (isPaused || showResultPopup) && styles.blurred,
            ]}
          >
            <Text style={styles.questionText}>
              {qIndex + 1}. {question.questionText}
            </Text>

            {question.options.map((option, index) => {
              const selected = selectedAnswers[question._id];
              const correctAnswerIndex = convertLetterToIndex(question.correctAnswer);
              const isCorrect = index.toString() === correctAnswerIndex;
              const isSelected = selected === index;

              let optionStyle = {
                backgroundColor: isSelected ? '#add8e6' : '#f0f0f0',
              };

              if (submitted || (showCorrectImmediately && selected !== undefined)) {
                if (isCorrect) {
                  optionStyle = {
                    ...optionStyle,
                    borderColor: 'lightgreen',
                    borderWidth: 2,
                  };
                } else if (isSelected && !isCorrect) {
                  optionStyle = {
                    ...optionStyle,
                    borderColor: 'red',
                    borderWidth: 2,
                  };
                }
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.optionContainer, optionStyle]}
                  onPress={() => handleAnswerSelect(question._id, index)}
                  disabled={submitted || isPaused || (showCorrectImmediately && selected !== undefined)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Show explanation only after submission */}
            {submitted && (
              <>
                <TouchableOpacity
                  onPress={() => handleToggleExplanation(question._id)}
                  style={styles.explanationButton}
                >
                  <Text style={styles.explanationButtonText}>
                    {explanationsVisible[question._id] ? 'Hide' : 'Show'} Explanation
                  </Text>
                </TouchableOpacity>

                {explanationsVisible[question._id] && (
                  <Text style={styles.explanationText}>
                    💡 {question.explanation || 'No explanation available.'}
                  </Text>
                )}
              </>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Pause Overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseText}>PAUSED</Text>
          <TouchableOpacity 
            style={styles.resumeButton}
            onPress={handlePauseResume}
          >
            <MaterialIcons name="play-arrow" size={30} color="#fff" />
            <Text style={styles.resumeText}>Resume</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Result Popup with Overlay */}
      {showResultPopup && (
        <>
          <View style={styles.resultOverlay} />
          <View style={styles.resultPopup}>
            <Text style={styles.resultText}>
              🎉 {score === questions.length
                ? 'Perfect!'
                : score > questions.length / 2
                ? 'Well done!'
                : 'Keep practicing!'}
            </Text>
            <Text style={styles.resultSubText}>
              You scored {score} out of {questions.length}
            </Text>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={() => {
                setShowResultPopup(false);
                // Don't reset states here - let user review answers
              }}
            >
              <Text style={styles.popupButtonText}>Review Answers</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Add a floating "Try Again" button that appears only after reviewing */}
      {submitted && !showResultPopup && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleTryAgain}
        >
          <Text style={styles.floatingButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: 'rgb(35, 126, 230)', 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  customHeader: {
    backgroundColor: "rgb(35, 126, 230)",
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  scrollContainer: { paddingHorizontal: 20, marginTop: 10 },
  blurredBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  questionContainer: {
    marginBottom: 30,
  },
  questionText: { fontSize: 16,  marginBottom: 12 },
  optionContainer: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 5,
  },
  optionText: { fontSize: 16 },
  explanationButton: {
    alignSelf: 'flex-start',
    marginTop: 5,
    padding: 4,
  },
  explanationButtonText: {
    color: '#4285f4',
    fontWeight: 'bold',
    fontSize: 14,
  },
  explanationText: {
    fontStyle: 'italic',
    color: '#333',
    marginTop: 6,
    paddingLeft: 4,
  },
  blurred: {
    opacity: 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Add black background
  },
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 999,
  },
  resultPopup: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    alignItems: 'center',
    zIndex: 1000,
  },
  resultText: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  resultSubText: { fontSize: 18, marginBottom: 16 },
  popupButton: {
    backgroundColor: '#4285f4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  popupButtonText: { color: '#fff', fontWeight: 'bold' },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pauseText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  resumeButton: {
    flexDirection: 'row',
    backgroundColor: '#4285f4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
  },
  resumeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4285f4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  floatingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});



export default QuestionView;






