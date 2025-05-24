// Move the chat room detail to a separate stack outside the tabs
// This file would be at app/chatroom/[id].js instead of app/student/chatroom/[id].js

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { api, API_BASE_URL } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const ChatRoomDetail = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const roomId = params?.id;
  const roomName = params?.roomName;
  
  const router = useRouter();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [roomDetails, setRoomDetails] = useState(null);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [joinedMembers, setJoinedMembers] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const flatListRef = useRef(null);
  const socketRef = useRef(null);

  // Request permission for image library
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
      }
    })();
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Get current user ID from AsyncStorage
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setCurrentUserId(userData._id || userData.id);
        } else {
          const userId = await AsyncStorage.getItem('userId');
          if (userId) {
            setCurrentUserId(userId);
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    
    getCurrentUser();
  }, []);

  // Fetch room details
  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (!roomId) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/api/v1/chat/rooms/${roomId}`);
        if (response.success) {
          setRoomDetails(response.data);
          setJoinedMembers(response.data.participants?.length || 0);
        } else {
          Alert.alert('Error', 'Failed to load chat room details');
        }
      } catch (error) {
        console.error('Error fetching room details:', error);
        Alert.alert('Error', 'Failed to load chat room details');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [roomId]);

  // Setup socket connection
  useEffect(() => {
    if (!roomId) return;
    
    const setupSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        
        // Use API_BASE_URL from your api.js file
        const socket = io(API_BASE_URL, {
          auth: { token },
          transports: ['websocket'],
        });
        
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Socket connected');
          socket.emit('join_room', roomId);
        });

        socket.on('active_users_count', (count) => {
          console.log('Active users count:', count);
          setActiveUsersCount(count);
        });

        socket.on('receive_message', (message) => {
          console.log('Received message:', message);
          setMessages((prev) => [...prev, message]);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        });

        socket.on('disconnect', () => {
          console.log('Socket disconnected');
        });

        socket.on('error', (error) => {
          console.error('Socket error:', error);
        });

        // Request active users count
        socket.emit('get_active_users', roomId);
      } catch (error) {
        console.error('Error setting up socket:', error);
      }
    };

    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId]);

  // Fetch messages
  useEffect(() => {
    if (!roomId) return;
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        // Try to get messages from the server
        try {
          const response = await api.get(`/api/v1/chat/rooms/${roomId}/messages`);
          if (response.success) {
            const serverMessages = response.data;
            setMessages(serverMessages);
            
            // Save to local storage for offline access
            try {
              await saveChatHistory(roomId, serverMessages);
            } catch (storageError) {
              console.error('Error saving server messages to storage:', storageError);
            }
            
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
            return;
          }
        } catch (serverError) {
          console.log('Error fetching messages from server, using local history:', serverError);
        }
        
        // If server request failed, use local history
        try {
          const localMessages = await loadChatHistory(roomId);
          if (localMessages && localMessages.length > 0) {
            setMessages(localMessages);
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
          } else {
            console.log('No local messages found');
            setMessages([]);
          }
        } catch (localError) {
          console.error('Error loading local chat history:', localError);
          setMessages([]);
          Alert.alert('Error', 'Failed to load messages');
        }
      } catch (error) {
        console.error('Error in fetchMessages:', error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [roomId]);

  // Image picker function
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Cancel image selection
  const cancelImageSelection = () => {
    setSelectedImage(null);
  };

  // Send message with or without image
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !roomId) return;

    setSending(true);
    try {
      // Create a temporary message for immediate display
      const tempMessage = {
        _id: `temp_${Date.now()}`,
        content: newMessage.trim(),
        sender: {
          userId: {
            _id: currentUserId,
            name: 'You',
          },
        },
        createdAt: new Date().toISOString(),
        pending: true,
      };

      // Clear input fields first
      const messageContent = newMessage.trim();
      setNewMessage('');
      setSelectedImage(null);

      // Add temporary message to the UI
      const updatedMessages = [...messages, tempMessage];
      setMessages(updatedMessages);
      
      // Scroll to the new message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Save to local storage immediately with pending status
      try {
        await saveChatHistory(roomId, updatedMessages);
      } catch (storageError) {
        console.error('Error saving to local storage:', storageError);
      }

      // Try to send to server
      try {
        let serverResponse = null;
        
        if (selectedImage) {
          // Image upload logic...
          const formData = new FormData();
          formData.append('roomId', roomId);
          
          if (messageContent) {
            formData.append('content', messageContent);
          }
          
          const uri = selectedImage;
          const fileType = uri.split('.').pop().toLowerCase();
          
          formData.append('image', {
            uri,
            name: `image.${fileType}`,
            type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
          });

          serverResponse = await api.postForm('/api/v1/chat/messages/image', formData);
        } else {
          // Text-only message
          serverResponse = await api.post('/api/v1/chat/messages', {
            roomId,
            content: messageContent,
          });
        }
        
        // If successful, the socket will add the real message
        // If not, we keep the temporary message marked as pending
        if (!serverResponse || !serverResponse.success) {
          throw new Error('Server response unsuccessful');
        }
      } catch (networkError) {
        console.log('Failed to send message to server, marking as failed');
        // Update the message list to mark this message as pending/failed
        const currentMessages = [...messages]; // Get current state
        const failedMessages = currentMessages.map(msg => 
          msg._id === tempMessage._id 
            ? { ...msg, pending: true, failed: true } 
            : msg
        );
        
        setMessages(failedMessages);
        
        // Save updated messages with failed status to local storage
        try {
          await saveChatHistory(roomId, failedMessages);
        } catch (storageError) {
          console.error('Error saving failed message to storage:', storageError);
        }
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Check if message is from current user
  const isCurrentUserMessage = (message) => {
    if (!currentUserId || !message.sender) return false;
    
    const senderId = message.sender.userId;
    
    // If senderId is an object with _id property
    if (typeof senderId === 'object' && senderId && senderId._id) {
      return senderId._id === currentUserId;
    }
    
    // If senderId is a string
    if (typeof senderId === 'string') {
      return senderId === currentUserId;
    }
    
    return false;
  };

  const renderItem = ({ item }) => {
    const isFromCurrentUser = isCurrentUserMessage(item);
    
    return (
      <View style={[
        styles.messageContainer,
        isFromCurrentUser ? styles.messageRight : styles.messageLeft
      ]}>
        <Text style={styles.messageSender}>
          {isFromCurrentUser ? 'You' : (item.sender?.userId?.name || 'User')}
        </Text>
        
        {item.content ? (
          <Text style={styles.messageContent}>{item.content}</Text>
        ) : null}
        
        {item.imageUrl && (
          <Image 
            source={{ uri: `${API_BASE_URL}${item.imageUrl}` }} 
            style={styles.messageImage}
            resizeMode="contain"
          />
        )}
        
        <View style={styles.messageFooter}>
          <Text style={styles.messageTimestamp}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          
          {/* Show pending/failed status */}
          {item.pending && (
            <View style={styles.statusContainer}>
              <Text style={[
                styles.statusText, 
                item.failed ? styles.failedText : styles.pendingText
              ]}>
                {item.failed ? 'Failed' : 'Sending...'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: roomDetails?.name || roomName || "Chat Room",
          headerRight: () => (
            <View style={styles.headerInfo}>
              <Text style={styles.headerInfoText}>
                {joinedMembers} joined | {activeUsersCount} active
              </Text>
            </View>
          ),
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
        }}
      />
      
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            {selectedImage && (
              <View style={styles.selectedImageContainer}>
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.selectedImage} 
                  resizeMode="contain"
                />
                <TouchableOpacity 
                  style={styles.cancelImageButton} 
                  onPress={cancelImageSelection}
                >
                  <Ionicons name="close-circle" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}
            
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => item._id || `msg-${index}`}
              renderItem={renderItem}
              contentContainerStyle={[
                styles.messagesList,
                keyboardVisible && { paddingBottom: 20 }
              ]}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
            
            <View style={[
              styles.inputContainer,
              { paddingBottom: keyboardVisible ? 90 : Math.max(10, insets.bottom) }
            ]}>
              <TouchableOpacity 
                style={styles.imagePickerButton} 
                onPress={pickImage}
                disabled={sending}
              >
                <Ionicons name="image" size={24} color="#2563eb" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.input}
                placeholder="Type your message..."
                value={newMessage}
                onChangeText={setNewMessage}
                editable={!sending}
                onFocus={() => {
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }, 200);
                }}
              />
              
              <TouchableOpacity 
                style={styles.sendButton} 
                onPress={handleSendMessage} 
                disabled={sending || (!newMessage.trim() && !selectedImage)}
              >
                <Text style={styles.sendButtonText}>{sending ? 'Sending...' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  headerInfo: {
    marginRight: 10,
  },
  headerInfoText: {
    color: '#fff',
    fontSize: 12,
  },
  messagesList: {
    padding: 10,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    maxWidth: '80%',
  },
  messageLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#e1f5fe',
    borderBottomLeftRadius: 2,
  },
  messageRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
    borderBottomRightRadius: 2,
  },
  messageSender: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 12,
  },
  messageContent: {
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 5,
  },
  messageTimestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',

    
  },
  imagePickerButton: {
    padding: 8,
    marginRight: 5,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    height: 40,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginLeft: 10,
    height: 40,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedImageContainer: {
    position: 'relative',
    backgroundColor: '#333',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 120,
  },
  cancelImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusContainer: {
    marginLeft: 4,
  },
  statusText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  pendingText: {
    color: '#9ca3af',
  },
  failedText: {
    color: '#ef4444',
  },
});

// Add these functions to handle chat history storage

// Save messages to AsyncStorage
const saveChatHistory = async (roomId, messagesToSave) => {
  if (!roomId || !messagesToSave || !Array.isArray(messagesToSave)) {
    console.error('Invalid parameters for saveChatHistory:', { roomId, messagesLength: messagesToSave?.length });
    return;
  }
  
  try {
    // Get existing chat history
    const chatHistoryString = await AsyncStorage.getItem('chatHistory');
    let chatHistory = {};
    
    if (chatHistoryString) {
      try {
        chatHistory = JSON.parse(chatHistoryString);
      } catch (parseError) {
        console.error('Error parsing chat history, resetting:', parseError);
        chatHistory = {};
      }
    }
    
    // Update history for this room
    chatHistory[roomId] = messagesToSave;
    
    // Limit the number of messages stored per room (e.g., last 50)
    if (chatHistory[roomId].length > 50) {
      chatHistory[roomId] = chatHistory[roomId].slice(-50);
    }
    
    // Save back to AsyncStorage
    await AsyncStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    console.log(`Saved ${messagesToSave.length} messages for room ${roomId}`);
  } catch (error) {
    console.error('Error in saveChatHistory:', error);
    throw error; // Re-throw to allow caller to handle
  }
};

// Load messages from AsyncStorage
const loadChatHistory = async (roomId) => {
  if (!roomId) {
    console.error('Invalid roomId for loadChatHistory');
    return [];
  }
  
  try {
    const chatHistoryString = await AsyncStorage.getItem('chatHistory');
    if (!chatHistoryString) {
      console.log('No chat history found in AsyncStorage');
      return [];
    }
    
    try {
      const chatHistory = JSON.parse(chatHistoryString);
      return Array.isArray(chatHistory[roomId]) ? chatHistory[roomId] : [];
    } catch (parseError) {
      console.error('Error parsing chat history:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error in loadChatHistory:', error);
    return [];
  }
};

// Update the useEffect for saving messages
useEffect(() => {
  const saveMessages = async () => {
    if (messages && messages.length > 0 && roomId) {
      try {
        await saveChatHistory(roomId, messages);
      } catch (error) {
        console.error('Error saving messages to AsyncStorage:', error);
      }
    }
  };
  
  saveMessages();
}, [messages, roomId]);

export default ChatRoomDetail;























