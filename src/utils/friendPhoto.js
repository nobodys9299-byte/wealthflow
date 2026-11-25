import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export const PERSON_AVATARS = [
  '👨‍💼', '👩‍💼', '🧔', '👱‍♀️', '🧑‍💻', '👵', '👴', '👮',
  '🧑‍🌾', '🧑‍🍳', '🧑‍🎓', '🧑‍🔬', '🧑‍🎨', '🧑‍✈️', '🦸', '🧕',
  '🧔‍♂️', '👩‍🦰', '👨‍🦱', '👩‍🦱', '🧑‍🦰', '🤠', '😎', '🧐',
];

export async function persistFriendPhotoUri(asset) {
  const rawUri = asset?.uri;
  if (!rawUri) return null;

  if (Platform.OS === 'web') {
    if (asset?.base64) {
      return `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
    }
    return rawUri;
  }

  try {
    if (FileSystem.documentDirectory && FileSystem.copyAsync) {
      const dir = `${FileSystem.documentDirectory}friend_photos/`;
      if (FileSystem.makeDirectoryAsync) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      }
      const isPng = rawUri.toLowerCase().includes('.png');
      const dest = `${dir}friend_${Date.now()}.${isPng ? 'png' : 'jpg'}`;
      await FileSystem.copyAsync({ from: rawUri, to: dest });
      return dest;
    }
  } catch (copyErr) {
    console.warn('Friend photo copy fallback:', copyErr);
  }
  return rawUri;
}

export async function pickFriendPhotoFromGallery(runWithSystemPicker = null) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return { status: 'denied', uri: null };
  }

  const invokePicker = () =>
    ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: Platform.OS === 'web',
    });

  const res = typeof runWithSystemPicker === 'function'
    ? await runWithSystemPicker(invokePicker)
    : await invokePicker();

  if (res?.canceled || !res?.assets?.[0]?.uri) {
    return { status: 'canceled', uri: null };
  }

  const storedUri = await persistFriendPhotoUri(res.assets[0]);
  return { status: 'ok', uri: storedUri || res.assets[0].uri };
}

export async function pickFriendPhotoFromCamera(runWithSystemPicker = null) {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    return { status: 'denied', uri: null };
  }

  const invokeCamera = () =>
    ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: Platform.OS === 'web',
    });

  const res = typeof runWithSystemPicker === 'function'
    ? await runWithSystemPicker(invokeCamera)
    : await invokeCamera();

  if (res?.canceled || !res?.assets?.[0]?.uri) {
    return { status: 'canceled', uri: null };
  }

  const storedUri = await persistFriendPhotoUri(res.assets[0]);
  return { status: 'ok', uri: storedUri || res.assets[0].uri };
}
