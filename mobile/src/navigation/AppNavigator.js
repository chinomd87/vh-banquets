import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import EventsScreen from '../screens/events/EventsScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import ClientsScreen from '../screens/clients/ClientsScreen';
import { 
  ClientDetailScreen, 
  StaffScreen, 
  MenuScreen, 
  ProfileScreen 
} from '../screens/PlaceholderScreens';
import LoadingScreen from '../screens/LoadingScreen';

// Icons (we'll use simple text for now, can be replaced with icon library)
import { Ionicons } from '@expo/vector-icons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Events Stack Navigator
function EventsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="EventsList" 
        component={EventsScreen}
        options={{ title: 'Events' }}
      />
      <Stack.Screen 
        name="EventDetail" 
        component={EventDetailScreen}
        options={{ title: 'Event Details' }}
      />
    </Stack.Navigator>
  );
}

// Clients Stack Navigator
function ClientsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ClientsList" 
        component={ClientsScreen}
        options={{ title: 'Clients' }}
      />
      <Stack.Screen 
        name="ClientDetail" 
        component={ClientDetailScreen}
        options={{ title: 'Client Details' }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Events') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Clients') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Staff') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          } else if (route.name === 'Menu') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Events" component={EventsStack} />
      <Tab.Screen name="Clients" component={ClientsStack} />
      <Tab.Screen name="Staff" component={StaffScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
