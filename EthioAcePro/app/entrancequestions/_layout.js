import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

export default function EntranceQuestionsLayout() {
  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="rgb(6, 80, 165)" // Dark red color
      />
      
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: 'rgb(6, 80, 165)',
          },
        }}
      >
        <Stack.Screen 
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="QuestionView" 
          options={{
            headerShown: false,
            animation: 'slide_from_right',
            presentation: 'card',
          }}
        />
      </Stack>
    </>
  );
}