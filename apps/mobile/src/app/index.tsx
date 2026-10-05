import { DarkTheme, DefaultTheme } from 'expo-router';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const { colors } = useColorScheme() === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          Project Connect
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});
