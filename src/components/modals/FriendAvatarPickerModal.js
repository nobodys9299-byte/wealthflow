import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../context/FinanceContext';
import { KeyboardSheetModal } from '../common/KeyboardSheetModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  PERSON_AVATARS,
  pickFriendPhotoFromGallery,
  pickFriendPhotoFromCamera,
} from '../../utils/friendPhoto';

export const FriendAvatarPickerModal = ({
  visible,
  onClose,
  friend,
}) => {
  const { theme, runWithSystemPicker, updateFriendAvatar } = useFinance();
  const [modalAlert, setModalAlert] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!friend) return null;

  const currentPhoto = friend.photoUri || null;
  const currentEmoji = friend.avatarEmoji || null;
  const friendInitial = (friend.name || 'F').charAt(0).toUpperCase();

  const handleGalleryPick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await pickFriendPhotoFromGallery(runWithSystemPicker);
      if (result.status === 'denied') {
        setModalAlert({
          title: 'Permission Needed',
          message: 'Please allow photo library access to choose a photo for this contact.',
          type: 'info',
        });
        return;
      }
      if (result.status === 'ok' && result.uri) {
        await updateFriendAvatar(friend.name, { photoUri: result.uri, avatarEmoji: null });
        onClose();
      }
    } catch (e) {
      setModalAlert({
        title: 'Photo Error',
        message: 'Could not load photo from gallery: ' + (e?.message || 'Error'),
        type: 'danger',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleCameraPick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await pickFriendPhotoFromCamera(runWithSystemPicker);
      if (result.status === 'denied') {
        setModalAlert({
          title: 'Camera Permission Needed',
          message: 'Please allow camera permission to take a photo for this contact.',
          type: 'info',
        });
        return;
      }
      if (result.status === 'ok' && result.uri) {
        await updateFriendAvatar(friend.name, { photoUri: result.uri, avatarEmoji: null });
        onClose();
      }
    } catch (e) {
      setModalAlert({
        title: 'Camera Error',
        message: 'Could not capture photo: ' + (e?.message || 'Error'),
        type: 'danger',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSelectEmoji = async (emoji) => {
    await updateFriendAvatar(friend.name, { photoUri: null, avatarEmoji: emoji });
    onClose();
  };

  const handleResetAvatar = async () => {
    await updateFriendAvatar(friend.name, { photoUri: null, avatarEmoji: '👤' });
    onClose();
  };

  return (
    <>
      <KeyboardSheetModal
        visible={visible}
        onClose={onClose}
        title="Change Contact Photo"
        subtitle={friend.name}
        icon="person-circle-outline"
        iconColor={theme.primaryLight}
        maxHeightRatio={0.84}
      >
        <View style={styles.body}>
          {/* Current Photo Preview */}
          <View style={styles.previewWrap}>
            <View style={[styles.previewCircle, { backgroundColor: `${theme.primary}25`, borderColor: theme.primary }]}>
              {currentPhoto ? (
                <Image source={{ uri: currentPhoto }} style={styles.previewImg} />
              ) : currentEmoji && currentEmoji !== '👤' ? (
                <Text style={{ fontSize: 38 }}>{currentEmoji}</Text>
              ) : (
                <Text style={[styles.previewInitial, { color: theme.primaryLight }]}>{friendInitial}</Text>
              )}
            </View>
            <Text style={[styles.previewName, { color: theme.text }]} numberOfLines={1}>
              {friend.name}
            </Text>
          </View>

          {/* Gallery & Camera Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={handleGalleryPick}
              disabled={busy}
              style={[styles.photoActionBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <Ionicons name="images-outline" size={18} color="#FFF" />
              <Text style={styles.photoActionPrimaryText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCameraPick}
              disabled={busy}
              style={[styles.photoActionSecondary, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="camera-outline" size={18} color={theme.text} />
              <Text style={[styles.photoActionSecondaryText, { color: theme.text }]}>Camera</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
            OR PICK AN AVATAR
          </Text>

          <View style={styles.avatarGrid}>
            {PERSON_AVATARS.map((av, idx) => {
              const isSelected = !currentPhoto && currentEmoji === av;
              return (
                <TouchableOpacity
                  key={`fav_${idx}`}
                  onPress={() => handleSelectEmoji(av)}
                  style={[
                    styles.avatarItem,
                    {
                      backgroundColor: isSelected ? `${theme.primary}30` : theme.inputBg,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 26 }}>{av}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {(currentPhoto || (currentEmoji && currentEmoji !== '👤')) && (
            <TouchableOpacity
              onPress={handleResetAvatar}
              style={[styles.removeBtn, { borderColor: theme.danger, backgroundColor: `${theme.danger}12` }]}
            >
              <Ionicons name="trash-outline" size={16} color={theme.danger} />
              <Text style={[styles.removeBtnText, { color: theme.danger }]}>Remove Custom Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardSheetModal>

      <ConfirmDeleteModal
        useModal={true}
        visible={!!modalAlert}
        onClose={() => setModalAlert(null)}
        onConfirm={() => setModalAlert(null)}
        title={modalAlert?.title || 'Notice'}
        message={modalAlert?.message || ''}
        type={modalAlert?.type || 'info'}
        showCancel={false}
        confirmText="OK"
        confirmIcon="information-circle-outline"
      />
    </>
  );
};

const styles = StyleSheet.create({
  body: {
    paddingTop: 4,
    paddingBottom: 12,
  },
  previewWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImg: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  previewInitial: {
    fontSize: 30,
    fontWeight: '900',
  },
  previewName: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  photoActionBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoActionPrimaryText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  photoActionSecondary: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoActionSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  avatarItem: {
    width: '15%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
