import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LanguageSelection() {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load saved language preference on component mount
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('appLanguage');
        if (savedLanguage) {
          setCurrentLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadLanguagePreference();
  }, []);

  const handleLanguageChange = async (languageCode) => {
    if (languageCode === currentLanguage) return;
    
    setLoading(true);
    try {
      // Store language preference in AsyncStorage
      await AsyncStorage.setItem('appLanguage', languageCode);
      setCurrentLanguage(languageCode);
      
      Alert.alert(
        'Success', 
        languageCode === 'en' 
          ? 'Language changed to English' 
          : 'ቋንቋው ወደ አማርኛ ተቀይሯል'
      );
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert('Error', 'Failed to change language. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentLanguage === 'en' ? 'Select Language' : 'ቋንቋ ይምረጡ'}
        </Text>
      </View>

      <Text style={styles.description}>
        {currentLanguage === 'en' 
          ? 'Choose your preferred language for the app interface.' 
          : 'ለመተግበሪያው ገጽታ የሚፈልጉትን ቋንቋ ይምረጡ።'}
      </Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={[
            styles.optionCard, 
            currentLanguage === 'en' && styles.selectedCard
          ]}
          onPress={() => handleLanguageChange('en')}
          disabled={loading}
        >
          <View style={styles.iconContainer}>
            <Ionicons 
              name="language" 
              size={40} 
              color={currentLanguage === 'en' ? "#fff" : "#2563eb"} 
            />
          </View>
          <Text style={[
            styles.optionTitle,
            currentLanguage === 'en' && styles.selectedText
          ]}>English</Text>
          <Text style={[
            styles.optionDescription,
            currentLanguage === 'en' && styles.selectedText
          ]}>
            Use English for all app content
          </Text>
          {currentLanguage === 'en' && (
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.optionCard, 
            currentLanguage === 'am' && styles.selectedCard
          ]}
          onPress={() => handleLanguageChange('am')}
          disabled={loading}
        >
          <View style={styles.iconContainer}>
            <Ionicons 
              name="language" 
              size={40} 
              color={currentLanguage === 'am' ? "#fff" : "#2563eb"} 
            />
          </View>
          <Text style={[
            styles.optionTitle,
            currentLanguage === 'am' && styles.selectedText
          ]}>አማርኛ</Text>
          <Text style={[
            styles.optionDescription,
            currentLanguage === 'am' && styles.selectedText
          ]}>
            {currentLanguage === 'en' 
              ? 'Use Amharic for all app content' 
              : 'ለሁሉም የመተግበሪያ ይዘት አማርኛን ይጠቀሙ'}
          </Text>
          {currentLanguage === 'am' && (
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.loadingText}>
            {currentLanguage === 'en' ? 'Changing language...' : 'ቋንቋ በመቀየር ላይ...'}
          </Text>
        </View>
      )}

      <Text style={styles.note}>
        {currentLanguage === 'en'
          ? 'Note: Some content may still be available only in English.'
          : 'ማሳሰቢያ፡ አንዳንድ ይዘቶች አሁንም በእንግሊዝኛ ብቻ ሊገኙ ይችላሉ።'}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    margin: 16,
    marginBottom: 24,
  },
  optionsContainer: {
    paddingHorizontal: 16,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  selectedCard: {
    backgroundColor: '#2563eb',
  },
  iconContainer: {
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  selectedText: {
    color: '#fff',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#2563eb',
    fontSize: 14,
  },
  note: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  }
});
