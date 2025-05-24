import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { useEffect } from 'react';

export default function TabLayout() {
  // Set status bar color when tab layout mounts
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('rgb(6, 80, 165)'); // Dark red color
    
    return () => {
      // Reset when unmounted
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('rgb(6, 80, 165)');
    };
  }, []);

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="rgb(6, 80, 165)" // Dark red color
      />
      
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#007AFF',
          tabBarLabelStyle: { fontSize: 13 },
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: 'rgb(35, 126, 230)', // Dark red background
          },
        }}
      >
        <Tabs.Screen
          name="[id]"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
            title: "Home",
          }}
        />
        <Tabs.Screen
          name="courses"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="school-outline" color={color} size={size} />
            ),
            title: "Courses",
          }}
        />
        <Tabs.Screen
          name="exams"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book-outline" color={color} size={size} />
            ),
            title: "Exams",
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" color={color} size={size} />
            ),
            title: "Schedule",
          }}
        />
        <Tabs.Screen
          name="chatroom/index"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles-outline" color={color} size={size} />
            ),
            title: "Chat",
          }}
        />
      </Tabs>
    </>
  );
}






