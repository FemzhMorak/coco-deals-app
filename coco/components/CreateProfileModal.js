import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import GlassCard from './GlassCard';

export default function CreateProfileModal({ visible, onClose, onSubmit }) {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    onSubmit(name);
    setName('');
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.backdrop}
        >
          <GlassCard style={styles.card} radius={28}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textDim} />
            </TouchableOpacity>

            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="account-circle-outline" size={30} color={colors.accent} />
            </View>

            <Text style={styles.title}>Create Your Profile</Text>
            <Text style={styles.subtitle}>Just your name — we'll generate the rest.</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            <TouchableOpacity
              style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.88}
              disabled={!name.trim()}
            >
              <LinearGradient
                colors={[colors.flameStart, colors.flameEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveGradient}
              >
                <Text style={styles.saveText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 14, right: 14, zIndex: 1, padding: 4 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  title: { color: colors.text, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.textDim, fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 18 },
  input: {
    width: '100%',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    marginBottom: 18,
  },
  saveBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.5 },
  saveGradient: { paddingVertical: 15, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
