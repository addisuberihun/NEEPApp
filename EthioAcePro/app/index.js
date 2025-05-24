 // app/index.js
import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions, StatusBar
} from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Set status bar for home screen
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('#C41E3A'); // Dark red color
    
    if (user) {
      // Prevent going back to this screen
      router.replace('/student');
    }
    
    return () => {
      // Reset when unmounted
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('#C41E3A');
    };
  }, [user]);

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#C41E3A" // Dark red color
      />
      
      <Stack.Screen 
        options={{
          headerTitle: "EthioAce",
          headerTitleStyle: {
            fontSize: 26,
            fontWeight: 'bold',
            color: '#fff',
          },
          headerStyle: {
            backgroundColor: '#C41E3A', // Dark red background
          },
          headerRight: () => (
            !user && (
              <View style={styles.headerButtons}>
                <Link href="/login" asChild>
                  <TouchableOpacity style={styles.authButton}>
                    <Text style={styles.authText}>Login</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="/sign-up" asChild>
                  <TouchableOpacity style={styles.signUpButton}>
                    <Text style={styles.authText}>Sign Up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            )
          ),
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>PASS YOUR EXAM WITH</Text>
          <Text style={styles.heroBrand}>EthioAce</Text>
        </View>

        <Text style={styles.sectionTitle}>Featured Resources</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
          style={styles.horizontalContainer}
        >
          <TouchableOpacity
            onPress={() => {
              user ? router.push('/tabs/courses') : router.replace('/login');
            }}
          >
            <InfoCard
              title="Comprehensive Courses"
              description="Access 100+ courses covering all subjects with expert instructors"
              image={require('../assets/images/courses.jpg')}
            />
          </TouchableOpacity>

          {/* Other cards */}
            <TouchableOpacity
            onPress={() => {
              user ? router.push('/tabs/courses') : router.replace('/login');
            }}
          >
          <InfoCard
            title="Exam Preparation"
            description="Proven strategies and techniques to ace your national exams"
            image={require('../assets/images/exam-preparation.jpg')}
            />
            </TouchableOpacity>
        </ScrollView>

        <View style={styles.storyBox}>
          <Text style={styles.storyTitle}>Our Education Story</Text>
          <Text style={styles.storyText}>
            EthioAce was founded in 2020 with a mission to democratize quality education...
          </Text>
          <TouchableOpacity style={styles.learnMoreButton}>
            <Text style={styles.learnMoreText}>Learn More About Us</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};

const InfoCard = ({ title, description, image }) => (
  <View style={styles.card}>
    <Image source={image} style={styles.cardImage} resizeMode="contain"/>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDescription}>{description}</Text>
  </View>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    marginRight: 1,
  },
  authButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  signUpButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal:18,
    borderRadius: 12,
    alignSelf: 'center',
  },
  authText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  hero: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  heroBrand: {
    fontSize: 33,
    color: '#f97316',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 20,
    marginBottom: 15,
  },
  horizontalContainer: {
    marginBottom: 20,
  },
  horizontalScroll: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  card: {
    width: width * 0.65,
    height: 300,
    backgroundColor: '#f3f4f6',
    padding: 20,
    borderRadius: 16,
    marginRight: 15,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f97316',
  },
  cardImage: {
    width: 200,
    height: 150,
    marginBottom: 15,
    alignSelf: 'center',
  },
  cardTitle: {
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 22,
    marginBottom: 10,
    color: '#1e40af',
  },
  cardDescription: {
    textAlign: 'center',
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 20,
  },
  storyBox: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 25,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 15,
    textAlign: 'center',
  },
  storyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
    marginBottom: 20,
    textAlign: 'center',
  },
  learnMoreButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
    width: '80%',
  },
  learnMoreText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 15,
  },
});

export default HomeScreen;
