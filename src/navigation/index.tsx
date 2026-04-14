import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import ProvisioningScreen from '../screens/ProvisioningScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlansScreen from '../screens/PlansScreen';
import AIDataSharingScreen from '../screens/AIDataSharingScreen';

const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

type Props = {
  isAuthenticated: boolean;
  containerReady: boolean;
  aiConsented: boolean;
  onAuth: (isContainerReady?: boolean) => void;
  onContainerReady: () => void;
  onLogout: () => void;
  onConsentChanged: (consented: boolean) => void;
};

function AuthNavigator({ onAuth }: { onAuth: (isContainerReady?: boolean) => void }) {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome">
        {(props) => <WelcomeScreen {...props} onAuth={onAuth} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Register">
        {(props) => <RegisterScreen {...props} onAuth={onAuth} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Login">
        {(props) => <LoginScreen {...props} onAuth={onAuth} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function AppNavigator({ onLogout, initialRoute, onContainerReady, aiConsented, onConsentChanged }: { onLogout: () => void; initialRoute: string; onContainerReady: () => void; aiConsented: boolean; onConsentChanged: (consented: boolean) => void }) {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <AppStack.Screen name="Provisioning">
        {(props) => <ProvisioningScreen {...props} onContainerReady={onContainerReady} />}
      </AppStack.Screen>
      <AppStack.Screen name="Chat">
        {(props) => <ChatScreen {...props} aiConsented={aiConsented} />}
      </AppStack.Screen>
      <AppStack.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </AppStack.Screen>
      <AppStack.Screen name="Plans" component={PlansScreen} />
      <AppStack.Screen name="AIDataSharing">
        {(props) => <AIDataSharingScreen {...props} onConsentChanged={onConsentChanged} />}
      </AppStack.Screen>
    </AppStack.Navigator>
  );
}

export default function RootNavigator({
  isAuthenticated,
  containerReady,
  aiConsented,
  onAuth,
  onContainerReady,
  onLogout,
  onConsentChanged,
}: Props) {
  if (isAuthenticated) {
    return <AppNavigator onLogout={onLogout} initialRoute={containerReady ? 'Chat' : 'Provisioning'} onContainerReady={onContainerReady} aiConsented={aiConsented} onConsentChanged={onConsentChanged} />;
  }
  return <AuthNavigator onAuth={onAuth} />;
}
