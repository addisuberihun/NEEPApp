import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

export default function GradeSubjects() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [subjects, setSubjects] = useState([]);
  
  // Get grade and subjects from params
  const grade = params?.grade || '9';
  
  useEffect(() => {
    if (params.subjects) {
      try {
        const parsedSubjects = JSON.parse(params.subjects);
        setSubjects(parsedSubjects);
      } catch (error) {
        console.error('Error parsing subjects:', error);
        setSubjects([]);
      }
    }
  }, [params.subjects]);

  const navigateToCourse = (subject) => {
    router.push({
      pathname: '/subjects/courseView',
      params: { grade: grade, subject: subject }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grade {grade} Subjects</Text>
      </View>
      
      {subjects.length > 0 ? (
        subjects.map((subject, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.subjectCard}
            onPress={() => navigateToCourse(subject.label)}
          >
            <View style={styles.subjectContent}>
              <Ionicons 
                name={subject.iconName} 
                size={24} 
                color="#3b82f6" 
                style={styles.subjectIcon}
              />
              <Text style={styles.subjectText}>{subject.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>No subjects available</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 30,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
  }
});