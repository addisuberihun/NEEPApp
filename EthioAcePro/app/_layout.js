import { Stack } from "expo-router";
import { StatusBar } from 'react-native';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* Set default status bar style */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor=" rgb(6, 80, 165)" 
        translucent={false} 
      />
      
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen 
          name="entrancequestions" 
          options={{ 
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'none',
          }} 
        />
        <Stack.Screen 
          name="index" 
          options={{ 
            headerTitle: "EthioAce",
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="(auth)" 
          options={{ 
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="student" 
          options={{ 
            headerShown: false,
            headerTitle: "(tabs)"
          }} 
        />
        <Stack.Screen
          name="chatroom/[id]"
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: 'rgb(35, 126, 230)',
            },
            headerTintColor: '#fff',
            // The actual header title will be set in the component
          }}
        />
      </Stack>
    </AuthProvider>
  );
}




