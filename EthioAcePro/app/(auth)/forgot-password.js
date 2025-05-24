import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import { api } from "../api";
import { Stack } from "expo-router";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/api/v1/password/request", { email });
      
      if (response.success) {
        setEmailSent(true);
        Alert.alert(
          "Success", 
          "Password reset instructions have been sent to your email",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", response.message || "Failed to send reset email");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      Alert.alert(
        "Error", 
        "Something went wrong. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Forgot Password",
          headerStyle: {
            backgroundColor: "#2563eb",
          },
          headerTintColor: "#fff",
        }}
      />
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset your password
          </Text>
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
          editable={!loading && !emailSent}
        />

        {emailSent ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              Check your email for password reset instructions
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.resetText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        )}
        {!emailSent && (
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <Text style={styles.backLinkText}>← Back to Login</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
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
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 10,
    color: "#1f2937",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    color: "#6b7280",
    fontSize: 16,
    lineHeight: 22,
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
  resetBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 25,
    marginHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  backLink: {
    marginTop: 20,
    alignItems: "center",
  },
  backLinkText: {
    color: "#6b7280",
    fontSize: 16,
  },
  successContainer: {
    marginTop: 30,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  successText: {
    fontSize: 16,
    color: "#10b981",
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#1f2937",
    fontWeight: "500",
  },
});