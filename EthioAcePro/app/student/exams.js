import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, Alert } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ExamsScreen = () => {
  const router = useRouter();
  const [userStream, setUserStream] = useState('Natural'); // Default to Natural
  
  // Define common subjects for both streams
  const commonSubjects = ['English', 'Mathematics', 'Aptitude'];
  
  // Define stream-specific subjects
  const naturalSubjects = ['Biology', 'Chemistry', 'Physics'];
  const socialSubjects = ['Geography', 'History', 'Economics'];
  
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
      }
    };

    fetchUserStream();
  }, []);
  
  // Get subjects based on user's stream
  const getStreamSubjects = () => {
    const streamSpecificSubjects = userStream === 'Natural' ? naturalSubjects : socialSubjects;
    return [...commonSubjects, ...streamSpecificSubjects];
  };
  
  const examYears = [
    { id: '1', year: '2012', subjects: getStreamSubjects() },
    { id: '2', year: '2013', subjects: getStreamSubjects() },
    { id: '3', year: '2014', subjects: getStreamSubjects() },
    { id: '4', year: '2015', subjects: getStreamSubjects() },
    { id: '5', year: '2016', subjects: getStreamSubjects() },
  ];

  const [selectedYearIndex, setSelectedYearIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const flatListRef = useRef(null);

  const handleYearSelect = (index) => {
    setSelectedYearIndex(index);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: index * width, animated: true });
    }
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    if (newIndex !== selectedYearIndex) {
      setSelectedYearIndex(newIndex);
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: newIndex, animated: true });
      }
    }
  };

  const startExam = (subject) => {
    const year = examYears[selectedYearIndex]?.year || "2023"; // Provide default if undefined
    console.log('Starting exam with:', { year, subject }); // Debug log
    
    // Validate parameters before navigation
    if (!year || !subject) {
      Alert.alert("Error", "Missing year or subject information");
      return;
    }
    
    router.push({
      pathname: '/entrancequestions/QuestionView',
      params: { 
        year: year.toString(), // Ensure year is a string
        subject: subject 
      }
    });
  };

  const renderYearTab = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.tab, selectedYearIndex === index && styles.tabActive]}
      onPress={() => handleYearSelect(index)}
    >
      <Text style={[styles.tabText, selectedYearIndex === index && styles.tabTextActive]}>
        {item.year}
      </Text>
    </TouchableOpacity>
  );

  const renderSubjectItem = ({ item }) => (
    <TouchableOpacity
      style={styles.subjectCard}
      onPress={() => startExam(item)}
    >
      <Text style={styles.subjectText}>{item}</Text>
      <MaterialIcons name="chevron-right" size={24} color="#555" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Stream Indicator */}
      <View style={styles.streamIndicator}>
        <Text style={styles.streamText}>{userStream} Science Stream</Text>
      </View>
      
      {/* Year Tabs */}
      <FlatList
        ref={flatListRef}
        data={examYears}
        renderItem={renderYearTab}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabContainer}
        getItemLayout={(data, index) => ({
          length: 100,
          offset: 100 * index,
          index,
        })}
      />

      {/* Subject List */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {examYears.map((yearItem, index) => (
          <View key={yearItem.id} style={styles.page}>
            <Text style={styles.header}>{yearItem.year} Entrance Exams</Text>
            <FlatList
              data={yearItem.subjects}
              renderItem={renderSubjectItem}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  streamIndicator: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  streamText: {
    color: '#0369a1',
    fontWeight: '600',
    fontSize: 14,
  },
  tabContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  
  },
  tab: {
    paddingVertical: 2,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    height: 38,
    allignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#4285f4',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    
  },
  page: {
    width,
    paddingTop: 0,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    marginTop: 10,
  },
  listContainer: {
    paddingBottom: 0,
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  subjectText: {
    fontSize: 16,
    color: '#333',
  },
});

export default ExamsScreen;


