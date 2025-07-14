import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Placeholder screens for navigation
const ClientDetailScreen = ({ route }) => {
  const { clientId } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Client Detail Screen</Text>
      <Text style={styles.subtext}>Client ID: {clientId}</Text>
    </View>
  );
};

const StaffScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Staff Management</Text>
    <Text style={styles.subtext}>Coming soon...</Text>
  </View>
);

const MenuScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Menu Management</Text>
    <Text style={styles.subtext}>Coming soon...</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Profile Settings</Text>
    <Text style={styles.subtext}>Coming soon...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: '#8E8E93',
  },
});

export { ClientDetailScreen, StaffScreen, MenuScreen, ProfileScreen };
