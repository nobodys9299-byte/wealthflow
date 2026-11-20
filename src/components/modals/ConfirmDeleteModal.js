import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../context/FinanceContext';

export const ConfirmDeleteModal = ({
  visible,
  onClose,
  onConfirm,
  onCancel,
  title = 'Delete Item?',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText,
  cancelText = 'Cancel',
  confirmIcon,
  type = 'danger', // 'danger' | 'info' | 'primary' | 'success'
  showCancel = true,
  useModal = true,
}) => {
  const { theme, t } = useFinance();

  if (!visible) return null;

  const isDanger = type === 'danger';
  const isSuccess = type === 'success';

  let badgeBg = `${theme.primary}25`;
  let badgeIcon = confirmIcon || 'information-circle';
  let badgeColor = theme.primaryLight;
  let btnBg = theme.primary;

  if (isDanger) {
    badgeBg = theme.dangerBg;
    badgeIcon = confirmIcon || 'alert-circle';
    badgeColor = theme.danger;
    btnBg = theme.danger;
  } else if (isSuccess) {
    badgeBg = 'rgba(16, 185, 129, 0.2)';
    badgeIcon = confirmIcon || 'checkmark-circle';
    badgeColor = '#10B981';
    btnBg = '#10B981';
  }

  const defaultBtnText = !showCancel
    ? 'OK'
    : isDanger
    ? t('delete', 'Delete')
    : t('confirm', 'Confirm');

  const finalConfirmText = confirmText || defaultBtnText;
  const finalBtnIcon = confirmIcon || (isDanger ? 'trash-outline' : isSuccess ? 'checkmark-circle-outline' : 'checkmark-outline');

  const modalContent = (
    <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
      <View style={[styles.dialogCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Icon Badge */}
        <View style={[styles.iconBadge, { backgroundColor: badgeBg }]}>
          <Ionicons name={badgeIcon} size={32} color={badgeColor} />
        </View>

        <Text style={[styles.dialogTitle, { color: theme.text }]}>
          {title === 'Delete Item?' ? `${t('delete', 'Delete')}?` : title}
        </Text>
        <Text style={[styles.dialogMessage, { color: theme.textMuted }]}>{message}</Text>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {showCancel && (
            <TouchableOpacity
              onPress={() => {
                onCancel && onCancel();
                onClose && onClose();
              }}
              style={[styles.btn, styles.cancelBtn, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: theme.text }]}>{cancelText}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              onConfirm && onConfirm();
              onClose && onClose();
            }}
            style={[
              styles.btn,
              styles.confirmBtn,
              { backgroundColor: btnBg },
              !showCancel && { flex: 1, width: '100%' },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name={finalBtnIcon} size={16} color="#FFF" />
            <Text style={styles.confirmBtnText}>{finalConfirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (!useModal) {
    return (
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 99999, elevation: 99999 }]}>
        {modalContent}
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {modalContent}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  dialogMessage: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
