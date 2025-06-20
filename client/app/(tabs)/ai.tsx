import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function AiScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Yapay Zeka Asistanı</ThemedText>
      <ThemedText>Yapay zeka özellikleri burada yer alacak.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 