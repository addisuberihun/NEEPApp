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
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { api } from "../../api";

export default function ResetPassword() {
  const { token } = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureText, setSecureText] = useState({
    password: true,
    confirmPassword: true,
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const router = useRouter();

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        Alert.alert("Error", "Invalid reset link", [
          { text: "OK", onPress: () => router.replace("/login") }
        ]);
        return;
      }

      try {
        setVerifying(true);
        const response = await api.get(`/api/v1/password/verify/${token}`);
        
        if (response.success) {
          setTokenValid(true);
        } else {
          Alert.alert("Error", "This password reset link is invalid or has expired", [
            { text: "OK", onPress: () => router.replace("/login") }
          ]);
        }
      } catch (error) {
        console.error("Token verification error:", error);
        Alert.alert("Error", "Failed to verify reset link", [
          { text: "OK", onPress: () => router.replace("/login") }
        ]);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const toggleSecureText = (field) => {
    setSecureText({ ...secureText, [field]: !secureText[field] });
  };

  const handleResetPassword = async () => {
    // Validate passwords
    if (!password) {
      Alert.alert("Error", "Please enter a new password");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(`/api/v1/password/reset/${token}`, { 
        password 
      });
      
      if (response.success) {
        setResetComplete(true);
        Alert.alert(
          "Success", 
          "Your password has been reset successfully",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", response.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Verifying reset link...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Reset Password",
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
        {!tokenValid ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              This password reset link is invalid or has expired.
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : resetComplete ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              Your password has been reset successfully!
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.loginButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Create New Password</Text>
              <Text style={styles.subtitle}>
                Your new password must be different from previous passwords
              </Text>
            </View>

            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter new password"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureText.password}
              />
              <TouchableOpacity
                onPress={() => toggleSecureText("password")}
                style={styles.toggleButton}
              >
                <Text style={styles.toggle}>{secureText.password ? "👁️" : "🙈"}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.passwordHint}>Must be at least 8 characters</Text>

            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Confirm new password"
                placeholderTextColor="#6b7280"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={secureText.confirmPassword}
              />
              <TouchableOpacity
                onPress={() => toggleSecureText("confirmPassword")}
                style={styles.toggleButton}
              >
                <Text style={styles.toggle}>{secureText.confirmPassword ? "👁️" : "🙈"}</Text>
              </TouchableOpacity>
            </View>

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
          </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6b7280",
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
    color: "#1f2937",
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
  passwordHint: {
    fontSize: 12,
    color: "#6b7280",
    marginHorizontal: 24,
    marginTop: 4,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    marginTop: 50,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 20,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    marginTop: 50,
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
  loginButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
});