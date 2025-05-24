import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

export default function AuthLayout() {
  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="rgb(6, 80, 165)" // Dark red color
      />
      
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: 'rgb(35, 126, 230)', // Dark red background
          },
          headerTintColor: '#fff', // White text color
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="sign-up" />
      </Stack>
    </>
  );
}
