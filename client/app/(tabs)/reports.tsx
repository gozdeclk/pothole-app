import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ReportsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Toplu Taşıma Takip Aracı</ThemedText>
      <ThemedText>Toplu taşıma araçları burada görünecek.</ThemedText>
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