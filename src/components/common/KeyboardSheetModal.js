import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../context/FinanceContext';
import { UI_TOKENS } from '../../constants/theme';

const SheetScrollContext = createContext({
  scrollToInput: () => {},
  scrollToBottom: () => {},
  scrollToTop: () => {},
  scrollRef: { current: null },
});

export const useSheetScroll = () => useContext(SheetScrollContext);

/**
 * Uniform bottom-sheet modal used across WealthFlow:
 * - Consistent backdrop fade + card slide-up animation
 * - Reliable outside-backdrop tap-to-close
 * - Automatic keyboard height tracking (Android edge-to-edge, iOS, Web)
 * - Built-in ScrollView + `scrollToInput` auto-scroll on TextInput focus
 */
export const KeyboardSheetModal = ({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  iconColor,
  headerLeft,
  headerRightExtra,
  scrollable = true,
  maxHeightRatio = 0.9,
  cardStyle,
  contentContainerStyle,
  overlayChildren,
  children,
}) => {
  const { theme } = useFinance();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [windowHeight, setWindowHeight] = useState(() => Dimensions.get('window').height);

  const slideAnim = useRef(new Animated.Value(60)).current;
  const scrollRef = useRef(null);
  const scrollContentRef = useRef(null);

  useEffect(() => {
    const dimSub = Dimensions.addEventListener('change', ({ window }) => {
      if (window?.height) setWindowHeight(window.height);
    });
    return () => dimSub?.remove?.();
  }, []);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }

    slideAnim.setValue(60);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: UI_TOKENS.animation.sheetSlideMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const h = e?.endCoordinates?.height || 0;
      setKeyboardHeight(h);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible, slideAnim]);

  const scrollToBottom = useCallback((animated = true) => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated });
    }, 90);
  }, []);

  const scrollToTop = useCallback((animated = true) => {
    scrollRef.current?.scrollTo?.({ y: 0, animated });
  }, []);

  const scrollToInput = useCallback((focusEventOrRef) => {
    setTimeout(() => {
      try {
        const target =
          focusEventOrRef?.currentTarget ||
          focusEventOrRef?.current ||
          null;
        const innerNode = scrollContentRef.current;

        if (target && innerNode && typeof target.measureLayout === 'function') {
          target.measureLayout(
            innerNode,
            (_x, y) => {
              scrollRef.current?.scrollTo?.({
                y: Math.max(0, y - 32),
                animated: true,
              });
            },
            () => {
              scrollRef.current?.scrollToEnd?.({ animated: true });
            }
          );
          return;
        }

        if (
          Platform.OS === 'web' &&
          focusEventOrRef?.target &&
          typeof focusEventOrRef.target.scrollIntoView === 'function'
        ) {
          focusEventOrRef.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (_e) {
        // Ignore measurement edge cases during unmount
      }
    }, 110);
  }, []);

  const effectiveBottomOffset = Platform.OS === 'web' ? 0 : keyboardHeight;
  const maxCardHeight = Math.max(
    260,
    Math.round((windowHeight - effectiveBottomOffset) * (keyboardHeight > 0 ? 0.94 : maxHeightRatio))
  );

  const handleClose = () => {
    Keyboard.dismiss();
    onClose && onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: theme.modalOverlay,
            paddingBottom: effectiveBottomOffset,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
          accessibilityLabel="Close dialog"
        />

        <Animated.View
          style={[
            styles.card,
            UI_TOKENS.shadow.sheet,
            {
              zIndex: 1,
              backgroundColor: theme.card,
              borderColor: theme.border,
              maxHeight: maxCardHeight,
              transform: [{ translateY: slideAnim }],
            },
            cardStyle,
          ]}
        >
          {/* Uniform Drag Pill */}
          <View style={styles.dragPillWrap}>
            <View style={[styles.dragPill, { backgroundColor: theme.border }]} />
          </View>

          {/* Uniform Header */}
          {(title || onClose || headerLeft) && (
            <View style={styles.header}>
              <View style={styles.headerLeftWrap}>
                {headerLeft}
                {!headerLeft && icon && (
                  <View
                    style={[
                      styles.iconBadge,
                      { backgroundColor: `${iconColor || theme.primary}20` },
                    ]}
                  >
                    <Ionicons
                      name={icon}
                      size={18}
                      color={iconColor || theme.primaryLight}
                    />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  {!!title && (
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                      {title}
                    </Text>
                  )}
                  {!!subtitle && (
                    <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.headerRightWrap}>
                {headerRightExtra}
                {onClose && (
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Close"
                  >
                    <Ionicons name="close" size={22} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Uniform Scrollable Body with Keyboard Auto-Scroll Context */}
          <SheetScrollContext.Provider
            value={{ scrollToInput, scrollToBottom, scrollToTop, scrollRef }}
          >
            {scrollable ? (
              <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                contentContainerStyle={[
                  styles.scrollBody,
                  { paddingBottom: keyboardHeight > 0 ? 28 : 20 },
                  contentContainerStyle,
                ]}
              >
                <View ref={scrollContentRef} collapsable={false} style={{ width: '100%' }}>
                  {children}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.nonScrollBody}>{children}</View>
            )}
          </SheetScrollContext.Provider>
        </Animated.View>

        {overlayChildren ? (
          <View
            style={[StyleSheet.absoluteFillObject, { zIndex: 9999, elevation: 50 }]}
            pointerEvents="box-none"
          >
            {overlayChildren}
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    borderTopLeftRadius: UI_TOKENS.radius.sheet,
    borderTopRightRadius: UI_TOKENS.radius.sheet,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: UI_TOKENS.spacing.sheetPadding,
    paddingTop: 8,
  },
  dragPillWrap: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  dragPill: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 14,
  },
  headerLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  headerRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    flexGrow: 1,
  },
  nonScrollBody: {
    flexShrink: 1,
  },
});
