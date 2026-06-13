import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DraftsScreen from '../screens/DraftsScreen';
import ArticlesScreen from '../screens/ArticlesScreen';
import EditorScreen from '../screens/EditorScreen';
import PostScreen from '../screens/PostScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  DraftsTab: undefined;
  ArticlesTab: undefined;
  NewPostTab: undefined;
};

export type DraftsStackParamList = {
  Drafts: undefined;
  Editor: { id?: string };
  Post: { id: string };
};

export type ArticlesStackParamList = {
  Articles: undefined;
  Post: { id: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const DraftsStack = createNativeStackNavigator<DraftsStackParamList>();
const ArticlesStack = createNativeStackNavigator<ArticlesStackParamList>();

function DraftsStackScreen() {
  return (
    <DraftsStack.Navigator screenOptions={{ headerShown: false }}>
      <DraftsStack.Screen name="Drafts" component={DraftsScreen} />
      <DraftsStack.Screen name="Editor" component={EditorScreen} />
      <DraftsStack.Screen name="Post" component={PostScreen} />
    </DraftsStack.Navigator>
  );
}

function ArticlesStackScreen() {
  return (
    <ArticlesStack.Navigator screenOptions={{ headerShown: false }}>
      <ArticlesStack.Screen name="Articles" component={ArticlesScreen} />
      <ArticlesStack.Screen name="Post" component={PostScreen} />
    </ArticlesStack.Navigator>
  );
}

function NewPostScreen({ navigation }: any) {
  // Navigate to editor immediately when this tab is pressed
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e: any) => {
      e.preventDefault();
      navigation.navigate('DraftsTab', { screen: 'Editor', params: {} });
    });
    return unsubscribe;
  }, [navigation]);

  return null;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { borderTopColor: '#eee' },
      }}
    >
      <Tab.Screen
        name="DraftsTab"
        component={DraftsStackScreen}
        options={{
          tabBarLabel: 'Drafts',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📝</Text>,
        }}
      />
      <Tab.Screen
        name="ArticlesTab"
        component={ArticlesStackScreen}
        options={{
          tabBarLabel: 'Articles',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📰</Text>,
        }}
      />
      <Tab.Screen
        name="NewPostTab"
        component={NewPostScreen}
        options={{
          tabBarLabel: 'New Post',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✏️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
      </AuthStack.Navigator>
    );
  }

  return <MainTabs />;
}
