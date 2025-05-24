import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { api } from '../api';
import { useAuth } from '../../src/context/AuthContext';
import { Link } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

export default function SignUp() {
  const { user, register } = useAuth(); // Get register function from auth context
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '+251',
    stream: 'Natural', // Default value for stream
    yourGoal: '', // New field for goal
    profilePicture: null,
  });

  const [errors, setErrors] = useState({});
  const [secureText, setSecureText] = useState({
    password: true,
    confirmPassword: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redirect logged-in users
  useEffect(() => {
    if (user) {
      router.replace('/tabs');
    }
  }, [user]);

  const validateForm = () => {
    let valid = true;
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
      valid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      valid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
      valid = false;
    } else if (!/^\+251\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be in format +251xxxxxxxxx';
      valid = false;
    }

    if (!formData.stream) {
      newErrors.stream = 'Stream must be selected';
      valid = false;
    }

    if (!formData.yourGoal) {
      newErrors.yourGoal = 'Your goal must be filled';
      valid = false;
    } else if (isNaN(formData.yourGoal) || parseInt(formData.yourGoal) <= 0) {
      newErrors.yourGoal = 'Your goal must be a positive number';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleImagePicker = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload an image.');
        return;
      }
      
      // Launch image picker with updated options
      const result = await ImagePicker.launchImageLibraryAsync({
        // Make sure to import the correct constants
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData({ ...formData, profilePicture: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isLoading) return;
    
    // Validate form
    if (!validateForm()) {
      return; // validateForm already sets errors
    }
    
    try {
      setIsLoading(true);
      
      // Use the register function from auth context
      const result = await register(formData);
      
      if (result.success) {
        Alert.alert(
          'Success',
          'Your account has been created successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Navigate to login page after successful signup
                router.replace('/login');
              }
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', result.error || 'Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert(
        'Error',
        'Network error or server unavailable. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (name, value) => {
    if (name === 'phoneNumber') {
      // Ensure the phone number starts with +251 and only digits after
      if (!value.startsWith('+251')) {
        value = '+251';
      }
      // Remove any non-digit characters after +251
      const afterPrefix = value.slice(4).replace(/[^0-9]/g, '');
      value = '+251' + afterPrefix;
    }
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null, general: null });
    }
  };

  const toggleSecureText = (field) => {
    setSecureText({ ...secureText, [field]: !secureText[field] });
  };
  // console.log('Signup error response:', error.response?.data);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.logo}>Join EthioAce</Text>
        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>Start your learning journey today</Text>
      </View>

      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      <Text style={styles.label}>Profile Picture (Optional)</Text>
      <TouchableOpacity
        style={styles.imagePickerContainer}
        onPress={handleImagePicker}
        disabled={isLoading}
      >
        {formData.profilePicture ? (
          <View style={styles.profileImageWrapper}>
            <Image
              source={{ uri: formData.profilePicture }}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => setFormData({ ...formData, profilePicture: null })}
              disabled={isLoading}
            >
              <Ionicons name="close-circle" size={25} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadContainer}>
            <Ionicons name="camera" size={24} color="#6b7280" />
          </View>
        )}
      </TouchableOpacity>
      {errors.profilePicture && <Text style={styles.errorText}>{errors.profilePicture}</Text>}

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        placeholder="Enter your name"
        placeholderTextColor="#6b7280"
        value={formData.name}
        onChangeText={(text) => handleChange('name', text)}
        editable={!isLoading}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={[styles.input, errors.phoneNumber && styles.inputError]}
        placeholder="e.g., +251912345678"
        placeholderTextColor="#6b7280"
        value={formData.phoneNumber}
        onChangeText={(text) => handleChange('phoneNumber', text)}
        keyboardType="phone-pad"
        editable={!isLoading}
        maxLength={13}
      />
      {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Enter your email"
        placeholderTextColor="#6b7280"
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <Text style={styles.label}>Stream</Text>
      <View style={[styles.pickerContainer, errors.stream && styles.inputError]}>
        <Picker
          selectedValue={formData.stream}
          onValueChange={(value) => handleChange('stream', value)}
          enabled={!isLoading}
          style={styles.picker}
        >
          <Picker.Item label="Natural" value="Natural" />
          <Picker.Item label="Social" value="Social" />
        </Picker>
      </View>
      {errors.stream && <Text style={styles.errorText}>{errors.stream}</Text>}

      <Text style={styles.label}>Your Goal (Score)</Text>
      <TextInput
        style={[styles.input, errors.yourGoal && styles.inputError]}
        placeholder="Enter your target score"
        placeholderTextColor="#6b7280"
        value={formData.yourGoal}
        onChangeText={(text) => handleChange('yourGoal', text)}
        keyboardType="numeric"
        editable={!isLoading}
      />
      {errors.yourGoal && <Text style={styles.errorText}>{errors.yourGoal}</Text>}

      <Text style={styles.label}>Password</Text>
      <View style={[styles.passwordWrapper, errors.password && styles.inputError]}>
        <TextInput
          style={[styles.input, { flex: 1, borderWidth: 0 }]}
          placeholder="Create a password"
          placeholderTextColor="#6b7280"
          value={formData.password}
          onChangeText={(text) => handleChange('password', text)}
          secureTextEntry={secureText.password}
          editable={!isLoading}
        />
        <TouchableOpacity onPress={() => toggleSecureText('password')} disabled={isLoading}>
          <Text style={styles.toggle}>{secureText.password ? '👁️' : '🙈'}</Text>
        </TouchableOpacity>
      </View>
      {errors.password ? (
        <Text style={styles.errorText}>{errors.password}</Text>
      ) : (
        <Text style={styles.passwordHint}>Must be at least 8 characters</Text>
      )}

      <Text style={styles.label}>Confirm Password</Text>
      <View style={[styles.passwordWrapper, errors.confirmPassword && styles.inputError]}>
        <TextInput
          style={[styles.input, { flex: 1, borderWidth: 0 }]}
          placeholder="Confirm your password"
          placeholderTextColor="#6b7280"
          value={formData.confirmPassword}
          onChangeText={(text) => handleChange('confirmPassword', text)}
          secureTextEntry={secureText.confirmPassword}
          editable={!isLoading}
        />
        <TouchableOpacity onPress={() => toggleSecureText('confirmPassword')} disabled={isLoading}>
          <Text style={styles.toggle}>{secureText.confirmPassword ? '👁️' : '🙈'}</Text>
        </TouchableOpacity>
      </View>
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

      <View style={styles.termsContainer}>
        <TouchableOpacity style={styles.checkbox} disabled={isLoading}>
          <Text>☑</Text>
        </TouchableOpacity>
        <Text style={styles.termsText}>
          I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.signupBtn, isLoading && styles.disabledBtn]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.signupText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity style={styles.googleBtn} disabled={isLoading}>
        <Image
          source={require('../../assets/images/google-icon.png')}
          style={styles.googleIcon}
        />
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Already have an account?{' '}
        <Link href="/login" asChild>
          <TouchableOpacity disabled={isLoading}>
            <Text style={styles.link}>Log in</Text>
          </TouchableOpacity>
        </Link>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    paddingBottom: 10,
  },
  logo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f97316',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 5,
    color: '#1f2937',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#6b7280',
    fontSize: 16,
  },
  label: {
    fontWeight: '500',
    marginTop: 15,
    color: '#1f2937',
    marginHorizontal: 24,
    fontSize: 15,
  },
  input: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 10,
    marginTop: 8,
    color: '#1f2937',
    marginHorizontal: 24,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    marginHorizontal: 24,
    marginTop: 5,
    fontSize: 13,
  },
  passwordHint: {
    color: '#6b7280',
    marginHorizontal: 24,
    marginTop: 5,
    fontSize: 13,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    marginHorizontal: 24,
    marginTop: 8,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  toggle: {
    fontSize: 20,
    color: '#6b7280',
    padding: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  uploadText: {
    color: '#6b7280',
    marginTop: 8,
    fontSize: 14,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 24,
  },
  checkbox: {
    marginRight: 10,
  },
  termsText: {
    color: '#6b7280',
    fontSize: 14,
    flex: 1,
  },
  termsLink: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  signupBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 25,
    marginHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    backgroundColor: '#60a5fa',
  },
  signupText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
    marginHorizontal: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#6b7280',
    fontSize: 14,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleText: {
    color: '#1f2937',
    fontWeight: '500',
    fontSize: 16,
  },
  footer: {
    textAlign: 'center',
    marginTop: 25,
    color: '#6b7280',
    fontSize: 15,
  },
  link: {
    color: '#2563eb',
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    marginTop: 8,
    marginHorizontal: 0,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#1f2937',
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginHorizontal: 24,
  },
  profileImageWrapper: {
    position: 'relative',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  uploadContainer: {
    width: 30,
    height: 30,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});










