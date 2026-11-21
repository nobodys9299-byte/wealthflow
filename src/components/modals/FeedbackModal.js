import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFinance } from '../../context/FinanceContext';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const FEEDBACK_EMAIL = 'iashwini914@gmail.com';

const FEEDBACK_TOPICS = [
  { id: 'feature', label: '💡 New Feature Idea' },
  { id: 'bug', label: '🐛 Bug / Issue Report' },
  { id: 'ui', label: '🎨 Design & UI Suggestion' },
  { id: 'praise', label: '⭐ Review & Appreciation' },
  { id: 'other', label: '💬 General Feedback' },
];

export const FeedbackModal = ({ visible, onClose }) => {
  const { theme, t } = useFinance();
  const [selectedTopic, setSelectedTopic] = useState('feature');
  const [feedbackText, setFeedbackText] = useState('');
  const [copied, setCopied] = useState(false);
  const [modalAlert, setModalAlert] = useState(null);
  const scrollRef = useRef(null);

  if (!visible) return null;

  const showModalAlert = (title, message, type = 'success') => {
    setModalAlert({ title, message, type });
  };

  const topicObj = FEEDBACK_TOPICS.find((tp) => tp.id === selectedTopic) || FEEDBACK_TOPICS[0];

  const handleSendEmail = async () => {
    const subject = encodeURIComponent(`[WealthFlow Feedback] ${topicObj.label}`);
    const bodyContent = feedbackText.trim()
      ? `Hi Ashwini,\n\n${feedbackText.trim()}\n\n---\nSent from WealthFlow Money Tracker App`
      : `Hi Ashwini,\n\nI would like to share my thoughts on WealthFlow:\n\n---\nSent from WealthFlow Money Tracker App`;
    const mailtoUrl = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${encodeURIComponent(bodyContent)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        await Linking.openURL(mailtoUrl).catch(() => {
          showModalAlert(
            'Feedback Email',
            `Please send your feedback directly to:\n${FEEDBACK_EMAIL}\n\nSubject: ${topicObj.label}`,
            'info'
          );
        });
      }
    } catch (e) {
      showModalAlert('Email Client Error', `Could not open mail app. You can copy the email: ${FEEDBACK_EMAIL}`, 'info');
    }
  };

  const handleCopyEmail = async () => {
    await Clipboard.setStringAsync(FEEDBACK_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showModalAlert('Email Copied!', `Developer email "${FEEDBACK_EMAIL}" copied to clipboard.`, 'success');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={onClose}
          />

          <View style={[styles.dialogCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Top Grab Bar Pill */}
            <View style={styles.dragPillWrap}>
              <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
            </View>

            {/* Modal Header */}
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.iconBadge, { backgroundColor: '#38BDF825' }]}>
                  <Ionicons name="chatbox-ellipses" size={20} color="#38BDF8" />
                </View>
                <View>
                  <Text style={[styles.title, { color: theme.text }]}>{t('share_feedback', 'Share Your Feedback')}</Text>
                  <Text style={[styles.subTitle, { color: theme.textMuted }]}>
                    {t('feedback_sub', 'Your thoughts shape the next update')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollRef}
              style={{ flexShrink: 1 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              contentContainerStyle={[styles.scrollBody, { flexGrow: 1, paddingBottom: 240 }]}
            >
            {/* Inspiring Compact Banner */}
            <View style={[styles.quoteCard, { backgroundColor: '#0F172A', borderColor: '#334155', paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sparkles" size={15} color="#38BDF8" />
                <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>
                  YOUR VOICE POWERS OUR APP 🚀
                </Text>
              </View>
              <Text style={{ color: '#CBD5E1', fontSize: 11, lineHeight: 16, marginTop: 4 }}>
                We read every email personally. Have an idea, request, or found a glitch? Tell us below!
              </Text>
            </View>

            {/* Direct Email Pill Box */}
            <View style={styles.emailPillBox}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.emailPillLabel}>{t('developer_email', 'DEVELOPER DIRECT EMAIL')}</Text>
                <Text style={styles.emailPillValue} numberOfLines={1}>{FEEDBACK_EMAIL}</Text>
              </View>
              <TouchableOpacity onPress={handleCopyEmail} style={styles.copyEmailBtn}>
                <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={14} color="#FFFFFF" />
                <Text style={styles.copyEmailBtnText}>{copied ? t('copied', 'Copied') : t('copy_email', 'Copy Email')}</Text>
              </TouchableOpacity>
            </View>

            {/* Topic Chips */}
            <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
              {t('what_is_feedback_about', 'WHAT IS YOUR FEEDBACK ABOUT?')}
            </Text>
            <View style={styles.topicRow}>
              {FEEDBACK_TOPICS.map((tp) => {
                const isSelected = selectedTopic === tp.id;
                return (
                  <TouchableOpacity
                    key={tp.id}
                    onPress={() => setSelectedTopic(tp.id)}
                    style={[
                      styles.topicChip,
                      {
                        backgroundColor: isSelected ? `${theme.primary}25` : theme.inputBg,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.topicChipText,
                        { color: isSelected ? theme.primaryLight : theme.text },
                      ]}
                    >
                      {tp.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Feedback Message Input */}
            <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
              {t('your_message_suggestion', 'YOUR MESSAGE OR SUGGESTION (OPTIONAL)')}
            </Text>
            <View style={[styles.textAreaBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <TextInput
                style={[styles.textArea, { color: theme.text }]}
                placeholder={t('write_feedback_placeholder', 'Write your feedback, feature request, or experience here...')}
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={feedbackText}
                onChangeText={setFeedbackText}
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 350);
                }}
              />
            </View>

            {/* Send Email Action Button */}
            <TouchableOpacity onPress={handleSendEmail} style={styles.sendEmailBtn}>
              <Ionicons name="mail" size={18} color="#FFFFFF" />
              <Text style={styles.sendEmailBtnText}>{t('open_email_app', 'Open Email App & Send Feedback')}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={[styles.footerNote, { color: theme.textMuted }]}>
              ⚡ Opens Gmail, Outlook, or your preferred default email app with details pre-filled.
            </Text>
          </ScrollView>
        </View>

        {/* Photo 2 Styled Dialog Inside Modal */}
        <ConfirmDeleteModal
          useModal={false}
          visible={!!modalAlert}
          onClose={() => setModalAlert(null)}
          onConfirm={() => setModalAlert(null)}
          title={modalAlert?.title || 'Notice'}
          message={modalAlert?.message || ''}
          type={modalAlert?.type || 'success'}
          showCancel={false}
          confirmText="OK"
          confirmIcon={modalAlert?.type === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline'}
        />
      </View>
      </KeyboardAvoidingView>
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
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
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
  scrollBody: {
    paddingBottom: 20,
  },
  quoteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  quoteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  quoteBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  quoteText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 6,
  },
  quoteDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
  emailPillBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  emailPillLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emailPillValue: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  copyEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyEmailBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  topicChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textAreaBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    minHeight: 110,
  },
  textArea: {
    fontSize: 14,
    minHeight: 86,
    textAlignVertical: 'top',
    padding: 0,
    lineHeight: 20,
  },
  sendEmailBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  sendEmailBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
});
