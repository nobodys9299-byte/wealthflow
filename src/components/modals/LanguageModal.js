import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../context/FinanceContext';

export const LanguageModal = ({ visible, onClose }) => {
  const { theme, language, setLanguage, t, SUPPORTED_LANGUAGES } = useFinance();
  const [search, setSearch] = useState('');

  if (!visible) return null;

  const filtered = SUPPORTED_LANGUAGES.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.nativeName.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  const handleSelectLanguage = (langId) => {
    setLanguage(langId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.dialogCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Top Drag / Grab Bar Pill */}
          <View style={styles.dragPillWrap}>
            <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconBadge, { backgroundColor: `${theme.primary}20` }]}>
                <Ionicons name="language" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>
                  {t('select_language', 'Select App Language')}
                </Text>
                <Text style={[styles.subTitle, { color: theme.textMuted }]}>
                  {t('choose_language_desc', 'Choose your preferred language for WealthFlow')}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Ionicons name="search" size={16} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder={t('search_language', 'Search language...')}
              placeholderTextColor={theme.textMuted}
              value={search}
              onChangeText={setSearch}
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Language List */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
            {filtered.map((lang) => {
              const isSelected = language === lang.id;
              return (
                <TouchableOpacity
                  key={lang.id}
                  onPress={() => handleSelectLanguage(lang.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.langCard,
                    {
                      backgroundColor: isSelected ? `${theme.primary}18` : theme.cardAlt,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={styles.flagText}>{lang.flag}</Text>
                    <View>
                      <Text
                        style={[
                          styles.nativeName,
                          { color: isSelected ? theme.primary : theme.text },
                        ]}
                      >
                        {lang.nativeName}
                      </Text>
                      <Text style={[styles.englishName, { color: theme.textMuted }]}>
                        {lang.name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.radioWrap}>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isSelected ? theme.primary : theme.textMuted}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dialogCard: {
    width: '100%',
    maxHeight: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  dragPillWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragPill: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  listContainer: {
    paddingBottom: 20,
    gap: 8,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  flagText: {
    fontSize: 26,
  },
  nativeName: {
    fontSize: 15,
    fontWeight: '800',
  },
  englishName: {
    fontSize: 11,
    marginTop: 1,
  },
  radioWrap: {
    paddingLeft: 8,
  },
});
