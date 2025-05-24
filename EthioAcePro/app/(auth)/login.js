import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, Link } from "expo-router";
import { api } from "../api"; // Make sure api is set up with Axios base URL
import { useAuth } from "../../src/context/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/student");
    }
  }, [user]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Validation Error", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      // Make the login request
      const response = await api.post("/api/v1/login/", { email, password });
      console.log("Login response:", response);

      if (response && response.token) {
        const { token, redirect, role, userId, stream } = response;

        // Store token in AsyncStorage
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("userId", userId.toString());
        await AsyncStorage.setItem("role", role);
        
        // Initialize empty chat history if it doesn't exist
        const existingChatHistory = await AsyncStorage.getItem("chatHistory");
        if (!existingChatHistory) {
          await AsyncStorage.setItem("chatHistory", JSON.stringify({}));
        }
        
        // Fetch user details to store complete user object
        try {
          const userResponse = await api.get(`/api/v1/students/${userId}`);
          console.log("User details:", userResponse);
          
          if (userResponse) {
            // Store complete user object in AsyncStorage
            const userData = {
              _id: userId,
              name: userResponse.name,
              email: userResponse.email,
              role: role,
              stream: stream || userResponse.stream,
              // Add any other user properties you need
            };
            
            console.log("Storing user data in AsyncStorage:", userData);
            await AsyncStorage.setItem("user", JSON.stringify(userData));
            
            // Update auth context
            login(userData, token);
          }
        } catch (userError) {
          console.error("Error fetching user details:", userError);
          // Even if we can't get full user details, create a minimal user object
          const minimalUserData = {
            _id: userId,
            role: role,
            stream: stream
          };
          await AsyncStorage.setItem("user", JSON.stringify(minimalUserData));
          login(minimalUserData, token);
        }

        // Debug print
        console.log("Backend suggested redirect:", redirect);
        
        // Override the backend redirect to always go to the home page first
        if (role === "student") {
          console.log("Redirecting to student home page");
          router.replace(`/student/${userId}`);
        } else if (role === "teacher") {
          console.log("Redirecting to teacher home page");
          router.replace(`/teacher/${userId}`);
        } else if (role === "super_admin") {
          console.log("Redirecting to admin dashboard");
          router.replace("/admin");
        } else {
          // Fallback to student home if role is undefined
          console.log("Role undefined, redirecting to student home as fallback");
          router.replace(`/student/${userId}`);
        }
      } else {
        Alert.alert("Login Failed", response?.message || "Invalid credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Login Error", "Something went wrong during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>Welcome to EthioAce</Text>
        <Text style={styles.title}>Login Now</Text>
        <Text style={styles.subtitle}>Access your learning dashboard</Text>
      </View>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#6b7280"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Enter your password"
          placeholderTextColor="#6b7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secureText}
        />
        <TouchableOpacity
          onPress={() => setSecureText(!secureText)}
          style={styles.toggleButton}
        >
          <Text style={styles.toggle}>{secureText ? "👁️" : "🙈"}</Text>
        </TouchableOpacity>
      </View>

      {/* Forgot Password Link */}
      <TouchableOpacity 
        onPress={() => router.push("/forgot-password")}
        style={styles.forgotPasswordContainer}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginBtn}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginText}>Login</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footer}>
        Don't have an account?{" "}
        <TouchableOpacity onPress={() => router.push("/sign-up")}>
          <Text style={styles.link}>Sign up</Text>
        </TouchableOpacity>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 24,
    paddingBottom: 10,
  },
  logo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#f97316",
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 5,
    color: "#1f2937",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    color: "#6b7280",
    fontSize: 16,
  },
  label: {
    fontWeight: "500",
    marginTop: 15,
    color: "#1f2937",
    marginHorizontal: 24,
  },
  input: {
    backgroundColor: "#f3f4f6",
    padding: 15,
    borderRadius: 10,
    marginTop: 8,
    color: "#1f2937",
    marginHorizontal: 24,
    fontSize: 16,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    marginHorizontal: 24,
    marginTop: 8,
    paddingRight: 10,
  },
  toggleButton: {
    padding: 8,
  },
  toggle: {
    fontSize: 20,
    color: "#6b7280",
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginRight: 24,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "500",
  },
  loginBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 25,
    marginHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    textAlign: "center",
    marginTop: 25,
    color: "#6b7280",
    fontSize: 15,
  },
  link: {
    color: "#2563eb",
    fontWeight: "600",
  },
});





