import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for refined UI
const COLORS = {
  grade9: ['#4ade80', '#22c55e'],
  grade10: ['#facc15', '#eab308'],
  grade11: ['#f87171', '#ef4444'],
  grade12: ['#60a5fa', '#3b82f6'],
  button: {
    background: '#f3f4f6', // Light gray background
    border: '#d1d5db',
    text: '#2563eb', // Blue text
    gradient: ['#f9fafb', '#e5e7eb'], // Fallback gradient if needed
  },
  text: {
    primary: '#fff',
    secondary: '#333',
    button: '#2563eb', // Blue text for buttons
  },
  shadow: '#000',
};

const SIZES = {
  borderRadius: {
    card: 20,
    button: 12,
  },
  padding: {
    card: 20,
    button: 16,
  },
  font: {
    title: 26,
    button: 18,
    stream: 14,
  },
  cardHeight: 220,
  shadowRadius: 8,
};

const SHADOWS = {
  card: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: SIZES.shadowRadius,
    elevation: 12,
  },
  button: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
};

const GradeButton = ({ iconName, link, label }) => (
  <Link href={link} asChild>
    <TouchableOpacity style={[styles.streamButton, SHADOWS.button]} activeOpacity={0.8}>
      <View style={styles.buttonContent}>
        <Ionicons name={iconName || "book-outline"} size={18} color={COLORS.text.button} style={styles.buttonIcon} />
        <Text style={styles.streamText}>{label || "Stream"}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.text.button} style={styles.arrowIcon} />
    </TouchableOpacity>
  </Link>
);

const Courses = () => {
  const router = useRouter();
  const [userStream, setUserStream] = useState('Natural'); // Default to Natural
  const [loading, setLoading] = useState(true);

  // Fetch user's stream from AsyncStorage
  useEffect(() => {
    const fetchUserStream = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.stream) {
            setUserStream(user.stream);
          }
        }
      } catch (error) {
        console.error('Error fetching user stream:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStream();
  }, []);

  // Define subject lists for each grade
  const grade9Subjects = [
    { iconName: 'book-outline', link: '/subjects/courseView?grade=9&subject=english', label: 'English' },
    { iconName: 'calculator-outline', link: '/subjects/courseView?grade=9&subject=mathematics', label: 'Mathematics' },
    { iconName: 'leaf-outline', link: '/subjects/courseView?grade=9&subject=biology', label: 'Biology' },
    { iconName: 'flask-outline', link: '/subjects/courseView?grade=9&subject=physics', label: 'Physics' },
    { iconName: 'globe-outline', link: '/subjects/courseView?grade=9&subject=geography', label: 'Geography' },
    { iconName: 'time-outline', link: '/subjects/courseView?grade=9&subject=history', label: 'History' },
    { iconName: 'beaker-outline', link: '/subjects/courseView?grade=9&subject=chemistry', label: 'Chemistry' }
  ];

  const grade10Subjects = [
    { iconName: 'book-outline', link: '/subjects/courseView?grade=10&subject=english', label: 'English' },
    { iconName: 'calculator-outline', link: '/subjects/courseView?grade=10&subject=mathematics', label: 'Mathematics' },
    { iconName: 'leaf-outline', link: '/subjects/courseView?grade=10&subject=biology', label: 'Biology' },
    { iconName: 'flask-outline', link: '/subjects/courseView?grade=10&subject=physics', label: 'Physics' },
    { iconName: 'globe-outline', link: '/subjects/courseView?grade=10&subject=geography', label: 'Geography' },
    { iconName: 'time-outline', link: '/subjects/courseView?grade=10&subject=history', label: 'History' },
    { iconName: 'beaker-outline', link: '/subjects/courseView?grade=10&subject=chemistry', label: 'Chemistry' }
  ];

  // Common subjects for both streams in grades 11 and 12
  const commonSubjects11 = [
    { iconName: 'book-outline', link: '/subjects/courseView?grade=11&subject=english', label: 'English' },
    { iconName: 'calculator-outline', link: '/subjects/courseView?grade=11&subject=mathematics', label: 'Mathematics' },
    { iconName: 'school-outline', link: '/subjects/courseView?grade=11&subject=aptitude', label: 'Aptitude' },
  ];

  const commonSubjects12 = [
    { iconName: 'book-outline', link: '/subjects/courseView?grade=12&subject=english', label: 'English' },
    { iconName: 'calculator-outline', link: '/subjects/courseView?grade=12&subject=mathematics', label: 'Mathematics' },
    { iconName: 'school-outline', link: '/subjects/courseView?grade=12&subject=aptitude', label: 'Aptitude' },
  ];

  // Stream-specific subjects for Natural Science
  const naturalSubjects11 = [
    { iconName: 'flask-outline', link: '/subjects/courseView?grade=11&subject=physics', label: 'Physics' },
    { iconName: 'beaker-outline', link: '/subjects/courseView?grade=11&subject=chemistry', label: 'Chemistry' },
    { iconName: 'leaf-outline', link: '/subjects/courseView?grade=11&subject=biology', label: 'Biology' },
    ...commonSubjects11
  ];

  const naturalSubjects12 = [
    { iconName: 'flask-outline', link: '/subjects/courseView?grade=12&subject=physics', label: 'Physics' },
    { iconName: 'beaker-outline', link: '/subjects/courseView?grade=12&subject=chemistry', label: 'Chemistry' },
    { iconName: 'leaf-outline', link: '/subjects/courseView?grade=12&subject=biology', label: 'Biology' },
    ...commonSubjects12
  ];

  // Stream-specific subjects for Social Science
  const socialSubjects11 = [
    { iconName: 'globe-outline', link: '/subjects/courseView?grade=11&subject=geography', label: 'Geography' },
    { iconName: 'time-outline', link: '/subjects/courseView?grade=11&subject=history', label: 'History' },
    { iconName: 'cash-outline', link: '/subjects/courseView?grade=11&subject=economics', label: 'Economics' },
    ...commonSubjects11
  ];

  const socialSubjects12 = [
    { iconName: 'globe-outline', link: '/subjects/courseView?grade=12&subject=geography', label: 'Geography' },
    { iconName: 'time-outline', link: '/subjects/courseView?grade=12&subject=history', label: 'History' },
    { iconName: 'cash-outline', link: '/subjects/courseView?grade=12&subject=economics', label: 'Economics' },
    ...commonSubjects12
  ];

  // Function to navigate to subjects list
  const navigateToSubjects = (grade, subjects) => {
    router.push({
      pathname: '/subjects/gradeSubjects',
      params: { 
        grade: grade,
        subjects: JSON.stringify(subjects)
      }
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Grade 9 */}
        <GradeBox 
          grade="9" 
          gradient={COLORS.grade9} 
          onPress={() => navigateToSubjects('9', grade9Subjects)}
        />
        
        {/* Grade 10 */}
        <GradeBox 
          grade="10" 
          gradient={COLORS.grade10} 
          onPress={() => navigateToSubjects('10', grade10Subjects)}
        />
        
        {/* Grade 11 - Based on user's stream */}
        <GradeBox 
          grade="11" 
          gradient={COLORS.grade11} 
          onPress={() => navigateToSubjects('11', 
            userStream === 'Natural' ? naturalSubjects11 : socialSubjects11
          )}
          stream={userStream}
        />
        
        {/* Grade 12 - Based on user's stream */}
        <GradeBox 
          grade="12" 
          gradient={COLORS.grade12} 
          onPress={() => navigateToSubjects('12', 
            userStream === 'Natural' ? naturalSubjects12 : socialSubjects12
          )}
          stream={userStream}
        />
      </View>
    </ScrollView>
  );
};

const GradeBox = ({ grade, gradient, onPress, stream }) => (
  <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gradeBox, SHADOWS.card]}>
    <Text style={styles.gradeText}>Grade {grade}</Text>
    
    {/* Show stream info for grades 11 and 12 */}
    {(grade === '11' || grade === '12') && stream && (
      <Text style={styles.streamInfo}>{stream} Science Stream</Text>
    )}
    
    <TouchableOpacity 
      style={[styles.button, SHADOWS.button]} 
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.buttonContent}>
        <Ionicons name="book-outline" size={20} color={COLORS.text.button} style={styles.buttonIcon} />
        <Text style={styles.buttonText}>View Subjects</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.text.button} style={styles.arrowIcon} />
    </TouchableOpacity>
  </LinearGradient>
);

const styles = StyleSheet.create({
  // Layout
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
    backgroundColor: '#f5f5f5', // Light background for contrast
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  gradeBox: {
    borderRadius: SIZES.borderRadius.card,
    padding: SIZES.padding.card,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: SIZES.cardHeight,
    marginBottom: 20,
  },
  streamContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },

  // Typography
  gradeText: {
    fontSize: SIZES.font.title,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  streamInfo: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.9,
  },
  buttonText: {
    fontSize: SIZES.font.button,
    fontWeight: '700',
    color: COLORS.text.button,
    textAlign: 'center',
  },
  streamText: {
    fontSize: SIZES.font.stream,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  // Components
  button: {
    backgroundColor: COLORS.button.background,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '90%', // Wider button
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between', // Space between text and arrow
    borderWidth: 1,
    borderColor: COLORS.button.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginTop: 16,
  },
  streamButton: {
    backgroundColor: COLORS.button.background,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between', // Space between text and arrow
    borderWidth: 1,
    borderColor: COLORS.button.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
    color: COLORS.text.button,
  },
  arrowIcon: {
    color: COLORS.text.button,
  },
});

export default Courses;

