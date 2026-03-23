import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'clawpool_jwt';

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}
