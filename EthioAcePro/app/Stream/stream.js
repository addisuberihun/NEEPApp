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
import { api } from '../api';
import { useTranslation } from '../../src/context/TranslationContext';

export default function StreamSelection() {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentStream, setCurrentStream] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Fetch current stream from AsyncStorage
    const fetchStream = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setCurrentStream(user.stream || 'Natural');
        }
      } catch (error) {
        console.error('Error fetching stream:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, []);

  const handleStreamChange = async (newStream) => {
    if (newStream === currentStream) return;
    
    setUpdating(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert(t('common.error'), 'User ID not found. Please log in again.');
        router.replace('/(auth)/login');
        return;
      }

      // Update stream in backend
      const response = await api.put(`/api/v1/students/${userId}`, {
        stream: newStream
      });

      if (response) {
        // Update local storage
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          user.stream = newStream;
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }

        setCurrentStream(newStream);
        Alert.alert(t('common.success'), `Your stream has been updated to ${newStream}.`);
      }
    } catch (error) {
      console.error('Error updating stream:', error);
      Alert.alert(t('common.error'), t('common.tryAgain'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
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
        <Text style={styles.headerTitle}>{t('streams.title')}</Text>
      </View>

      <Text style={styles.description}>
        {t('streams.description')}
      </Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={[
            styles.optionCard, 
            currentStream === 'Natural' && styles.selectedCard
          ]}
          onPress={() => handleStreamChange('Natural')}
          disabled={updating}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="flask" size={40} color={currentStream === 'Natural' ? "#fff" : "#2563eb"} />
          </View>
          <Text style={[
            styles.optionTitle,
            currentStream === 'Natural' && styles.selectedText
          ]}>{t('streams.natural')}</Text>
          <Text style={[
            styles.optionDescription,
            currentStream === 'Natural' && styles.selectedText
          ]}>
            {t('streams.naturalDescription')}
          </Text>
          {currentStream === 'Natural' && (
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.optionCard, 
            currentStream === 'Social' && styles.selectedCard
          ]}
          onPress={() => handleStreamChange('Social')}
          disabled={updating}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={40} color={currentStream === 'Social' ? "#fff" : "#2563eb"} />
          </View>
          <Text style={[
            styles.optionTitle,
            currentStream === 'Social' && styles.selectedText
          ]}>{t('streams.social')}</Text>
          <Text style={[
            styles.optionDescription,
            currentStream === 'Social' && styles.selectedText
          ]}>
            {t('streams.socialDescription')}
          </Text>
          {currentStream === 'Social' && (
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {updating && (
        <View style={styles.updatingContainer}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.updatingText}>Updating stream...</Text>
        </View>
      )}
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
  updatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  updatingText: {
    marginLeft: 8,
    color: '#2563eb',
    fontSize: 14,
  },
});
