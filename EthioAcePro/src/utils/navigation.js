import { useRouter } from 'expo-router';

export const useSafeNavigation = () => {
  const router = useRouter();
  
  const safeGoBack = () => {
    try {
      router.back();
    } catch (error) {
      // Fallback to home screen
      router.replace('/');
    }
  };
  
  return {
    ...router,
    safeGoBack,
  };
};
