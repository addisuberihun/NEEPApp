import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hours = Array.from({length: 16}, (_, i) => 7 + i); // 7:00 to 22:00
const { width } = Dimensions.get('window');

export default function ScheduleScreen() {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [schedules, setSchedules] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState({ day: '', time: '' });
  const [taskInput, setTaskInput] = useState('');
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(9);
  const [editMode, setEditMode] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerType, setTimePickerType] = useState('start');

  useEffect(() => {
    const today = new Date();
    setSelectedDay(today.toLocaleDateString('en-US', { weekday: 'long' }));
    setSelectedDate(today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
  }, []);

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    const date = new Date();
    date.setDate(date.getDate() + (days.indexOf(day) - date.getDay()));
    setSelectedDate(date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
  };

  const openTaskModal = (day, timeSlot) => {
    const existingTask = schedules[`${day}-${timeSlot}`];
    if (existingTask) {
      setCurrentTask({ day, time: timeSlot });
      setTaskInput(existingTask.subject);
      setStartHour(existingTask.startHour);
      setEndHour(existingTask.endHour);
      setEditMode(true);
    } else {
      setCurrentTask({ day, time: timeSlot });
      setTaskInput('');
      setStartHour(8);
      setEndHour(9);
      setEditMode(false);
    }
    setModalVisible(true);
  };

  const saveTask = () => {
    if (taskInput.trim()) {
      setSchedules(prev => ({
        ...prev,
        [`${currentTask.day}-${currentTask.time}`]: {
          subject: taskInput,
          startHour,
          endHour,
          duration: endHour - startHour
        }
      }));
    } else {
      const newSchedules = {...schedules};
      delete newSchedules[`${currentTask.day}-${currentTask.time}`];
      setSchedules(newSchedules);
    }
    setModalVisible(false);
    setShowTimePicker(false);
  };

  const deleteTask = () => {
    const newSchedules = {...schedules};
    delete newSchedules[`${currentTask.day}-${currentTask.time}`];
    setSchedules(newSchedules);
    setModalVisible(false);
    setShowTimePicker(false);
  };

  const formatTime = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const openTimePicker = (type) => {
    setTimePickerType(type);
    setShowTimePicker(true);
  };

  const selectHour = (hour) => {
    if (timePickerType === 'start') {
      setStartHour(hour);
      if (hour >= endHour) {
        setEndHour(Math.min(hour + 1, 22));
      }
    } else {
      setEndHour(hour);
      if (hour <= startHour) {
        setStartHour(Math.max(hour - 1, 7));
      }
    }
    setShowTimePicker(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Study Schedule</Text>
      
      <View style={styles.dateContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.daySelector}
          contentContainerStyle={styles.daySelectorContent}
        >
          {days.map(day => (
            <TouchableOpacity 
              key={day}
              style={[styles.dayButton, selectedDay === day && styles.selectedDay]}
              onPress={() => handleDaySelect(day)}
            >
              <Text style={[styles.dayText, selectedDay === day && styles.selectedDayText]}>
                {day.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.dateText}>{selectedDate}</Text>
      </View>

      <ScrollView style={styles.timeTable}>
        {hours.map(hour => {
          const timeSlot = `${hour}:00 - ${hour + 1}:00`;
          return (
            <View key={timeSlot} style={styles.timeSlot}>
              <Text style={styles.timeText}>{formatTime(hour)}</Text>
              <TouchableOpacity 
                style={[
                  styles.scheduleButton,
                  schedules[`${selectedDay}-${timeSlot}`] && styles.scheduledButton
                ]}
                onPress={() => openTaskModal(selectedDay, timeSlot)}
              >
                {schedules[`${selectedDay}-${timeSlot}`] ? (
                  <View style={styles.scheduledItem}>
                    <View style={styles.taskInfo}>
                      <Text style={styles.scheduleText} numberOfLines={1}>
                        {schedules[`${selectedDay}-${timeSlot}`].subject}
                      </Text>
                      <Text style={styles.timeRangeText}>
                        {formatTime(schedules[`${selectedDay}-${timeSlot}`].startHour)} - {formatTime(schedules[`${selectedDay}-${timeSlot}`].endHour)}
                      </Text>
                    </View>
                    <Ionicons name="pencil" size={16} color="#fff" />
                  </View>
                ) : (
                  <Ionicons name="add" size={24} color="#1e90ff" />
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editMode ? 'Edit Task' : 'Add Task'}</Text>
            
            <Text style={styles.inputLabel}>Task Description</Text>
            <TextInput
              style={styles.taskInput}
              placeholder="e.g. Math Homework, Biology Revision"
              value={taskInput}
              onChangeText={setTaskInput}
              autoFocus={true}
            />
            
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerGroup}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TouchableOpacity 
                  style={styles.timePickerButton}
                  onPress={() => openTimePicker('start')}
                >
                  <Text style={styles.timePickerText}>{formatTime(startHour)}</Text>
                  <MaterialIcons name="access-time" size={20} color="#555" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.timePickerGroup}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TouchableOpacity 
                  style={styles.timePickerButton}
                  onPress={() => openTimePicker('end')}
                >
                  <Text style={styles.timePickerText}>{formatTime(endHour)}</Text>
                  <MaterialIcons name="access-time" size={20} color="#555" />
                </TouchableOpacity>
              </View>
            </View>

            {showTimePicker && (
              <View style={styles.hourPicker}>
                <ScrollView>
                  {hours.map(hour => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.hourButton,
                        ((timePickerType === 'start' && hour === startHour) || 
                         (timePickerType === 'end' && hour === endHour)) && styles.selectedHour
                      ]}
                      onPress={() => selectHour(hour)}
                    >
                      <Text style={styles.hourText}>{formatTime(hour)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.modalButtons}>
              {editMode && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={deleteTask}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setShowTimePicker(false);
                }}
              >
                <Text style={[styles.buttonText, { color: '#333' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton, !taskInput.trim() && styles.disabledButton]}
                onPress={saveTask}
                disabled={!taskInput.trim()}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
    textAlign: 'center',
  },
  dateContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  daySelector: {
    maxHeight: 50,
  },
  daySelectorContent: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dayButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    height: 40,
  },
  selectedDay: {
    backgroundColor: '#4285f4',
  },
  dayText: {
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
    fontSize: 14,
  },
  selectedDayText: {
    color: '#fff',
  },
  dateText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    textAlign: 'center',
  },
  timeTable: {
    flex: 1,
    marginTop: 8,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dee2e6',
    marginHorizontal: 4,
  },
  timeText: {
    width: 100,
    color: '#6c757d',
    fontWeight: '500',
    fontSize: 14,
  },
  scheduleButton: {
    flex: 1,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginLeft: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  scheduledButton: {
    backgroundColor: '#4285f4',
    borderColor: '#4285f4',
  },
  scheduledItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '100%',
    height: '100%',
  },
  taskInfo: {
    flex: 1,
    marginRight: 8,
  },
  scheduleText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  timeRangeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
  },
  taskInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timePickerGroup: {
    width: '48%',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  timePickerText: {
    fontSize: 16,
    color: '#333',
  },
  hourPicker: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
  },
  hourButton: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  selectedHour: {
    backgroundColor: '#e3f2fd',
  },
  hourText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e9ecef',
  },
  saveButton: {
    backgroundColor: '#4285f4',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#fff',
  },
});