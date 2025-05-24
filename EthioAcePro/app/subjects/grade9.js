import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Grade9Subjects() {
  const router = useRouter();
  const subjects = [
    'English',
    'Mathematics',
    'Biology',
    'Physics',
    'Geography',
    'History',
    'Chemistry'
  ];

  const navigateToCourse = (subject) => {
    router.push({
      pathname: '/subjects/courseView',
      params: { grade: '9', subject: subject }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Grade 9 Subjects</Text>
      {subjects.map((subject, index) => (
        <TouchableOpacity 
          key={index}
          style={styles.subjectCard}
          onPress={() => navigateToCourse(subject)}
        >
          <View style={styles.subjectContent}>
            <Ionicons 
              name={getIconForSubject(subject)} 
              size={24} 
              color="#3b82f6" 
              style={styles.subjectIcon}
            />
            <Text style={styles.subjectText}>{subject}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// Helper function to get appropriate icon for each subject
function getIconForSubject(subject) {
  switch(subject.toLowerCase()) {
    case 'english':
      return 'book-outline';
    case 'mathematics':
      return 'calculator-outline';
    case 'biology':
      return 'leaf-outline';
    case 'physics':
      return 'flask-outline';
    case 'chemistry':
      return 'beaker-outline';
    case 'geography':
      return 'globe-outline';
    case 'history':
      return 'time-outline';
    default:
      return 'school-outline';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingTop: 30,
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  subjectCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIcon: {
    marginRight: 12,
  },
  subjectText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
});
