import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Animated,
  PanResponder,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DraggableAccountSlot = ({
  account,
  index,
  axis,
  isDragging,
  translateAnim,
  scaleAnim,
  draggingIdRef,
  itemPanHandlers,
  registerLayout,
  renderItem,
  beginDrag,
  finishIdleHold,
  dragHandleHandlers,
}) => {
  return (
    <Animated.View
      onLayout={(e) => registerLayout(account.id, e.nativeEvent.layout)}
      {...itemPanHandlers}
      style={{
        transform: [
          axis === 'x'
            ? { translateX: isDragging ? translateAnim : 0 }
            : { translateY: isDragging ? translateAnim : 0 },
          { scale: isDragging ? scaleAnim : 1 },
        ],
        zIndex: isDragging ? 999 : 1,
        elevation: isDragging ? 14 : 0,
      }}
    >
      {renderItem(account, index, {
        isDragging,
        beginDrag: () => beginDrag(account.id),
        finishIdleHold: () => finishIdleHold(account.id),
        isActivelyHeld: () => draggingIdRef.current === account.id,
        dragHandleHandlers,
      })}
    </Animated.View>
  );
};

export const DraggableAccountList = ({
  accounts = [],
  axis = 'x', // 'x' for horizontal Dashboard carousel | 'y' for vertical Accounts tab list
  onReorder,
  onDragStateChange,
  onHoldWithoutDrag,
  contentContainerStyle,
  renderItem,
}) => {
  const [draftAccounts, setDraftAccounts] = useState(accounts);
  const [draggingId, setDraggingId] = useState(null);

  const draftRef = useRef(accounts);
  const draggingIdRef = useRef(null);
  const layoutsRef = useRef({});
  const slotCentersRef = useRef([]);
  const startIndexRef = useRef(-1);
  const currentIndexRef = useRef(-1);
  const startPageCoordRef = useRef(null);
  const didClaimMoveRef = useRef(false);
  const didSwapRef = useRef(false);

  const translateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const latestPropsRef = useRef({ onReorder, onDragStateChange, onHoldWithoutDrag, axis });
  latestPropsRef.current = { onReorder, onDragStateChange, onHoldWithoutDrag, axis };

  useEffect(() => {
    if (!draggingIdRef.current) {
      draftRef.current = accounts;
      setDraftAccounts(accounts);
    }
  }, [accounts]);

  const registerLayout = useCallback((id, layout) => {
    if (!draggingIdRef.current) {
      layoutsRef.current[id] = layout;
    }
  }, []);

  const commitFinishDrag = useCallback((wasCancelledWithoutMove = false) => {
    const activeId = draggingIdRef.current;
    if (!activeId) return;

    const swapped = didSwapRef.current;
    const finalList = draftRef.current;

    draggingIdRef.current = null;
    startPageCoordRef.current = null;
    didClaimMoveRef.current = false;
    didSwapRef.current = false;
    setDraggingId(null);
    latestPropsRef.current.onDragStateChange?.(false);

    Animated.parallel([
      Animated.spring(translateAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 28,
        bounciness: 4,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 28,
        bounciness: 4,
      }),
    ]).start();

    if (swapped) {
      latestPropsRef.current.onReorder?.(finalList);
    } else if (wasCancelledWithoutMove) {
      latestPropsRef.current.onHoldWithoutDrag?.();
    }
  }, [translateAnim, scaleAnim]);

  const beginDrag = useCallback((accId) => {
    if (draggingIdRef.current) return;
    const list = draftRef.current;
    const idx = list.findIndex((a) => a.id === accId);
    if (idx < 0 || list.length < 2) {
      latestPropsRef.current.onHoldWithoutDrag?.();
      return;
    }

    const isX = latestPropsRef.current.axis === 'x';
    const fallbackStep = isX ? 186 : 196;
    slotCentersRef.current = list.map((item, i) => {
      const l = layoutsRef.current[item.id];
      if (l) {
        return isX ? l.x + l.width / 2 : l.y + l.height / 2;
      }
      return i * fallbackStep + fallbackStep / 2;
    });

    draggingIdRef.current = accId;
    startIndexRef.current = idx;
    currentIndexRef.current = idx;
    startPageCoordRef.current = null;
    didClaimMoveRef.current = false;
    didSwapRef.current = false;
    translateAnim.setValue(0);
    setDraggingId(accId);
    latestPropsRef.current.onDragStateChange?.(true);

    Animated.spring(scaleAnim, {
      toValue: 1.04,
      useNativeDriver: true,
      speed: 24,
      bounciness: 6,
    }).start();
  }, [translateAnim, scaleAnim]);

  const handleDragMove = useCallback((evt) => {
    const activeId = draggingIdRef.current;
    if (!activeId) return;

    const isX = latestPropsRef.current.axis === 'x';
    const pageCoord = isX ? evt.nativeEvent.pageX : evt.nativeEvent.pageY;
    if (typeof pageCoord !== 'number' || Number.isNaN(pageCoord)) return;

    if (startPageCoordRef.current === null) {
      startPageCoordRef.current = pageCoord;
      return;
    }

    const centers = slotCentersRef.current;
    const startIdx = startIndexRef.current;
    let curIdx = currentIndexRef.current;
    if (startIdx < 0 || curIdx < 0 || !centers.length) return;

    const rawDelta = pageCoord - startPageCoordRef.current;
    const draggedCenter = centers[startIdx] + rawDelta;

    // Check swap backward
    while (curIdx > 0) {
      const midPrev = (centers[curIdx] + centers[curIdx - 1]) / 2;
      if (draggedCenter < midPrev) {
        const nextIdx = curIdx - 1;
        const nextList = [...draftRef.current];
        const [moved] = nextList.splice(curIdx, 1);
        nextList.splice(nextIdx, 0, moved);
        try {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        } catch (_e) {}
        draftRef.current = nextList;
        curIdx = nextIdx;
        currentIndexRef.current = curIdx;
        didSwapRef.current = true;
        setDraftAccounts(nextList);
      } else {
        break;
      }
    }

    // Check swap forward
    while (curIdx < draftRef.current.length - 1) {
      const midNext = (centers[curIdx] + centers[curIdx + 1]) / 2;
      if (draggedCenter > midNext) {
        const nextIdx = curIdx + 1;
        const nextList = [...draftRef.current];
        const [moved] = nextList.splice(curIdx, 1);
        nextList.splice(nextIdx, 0, moved);
        try {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        } catch (_e) {}
        draftRef.current = nextList;
        curIdx = nextIdx;
        currentIndexRef.current = curIdx;
        didSwapRef.current = true;
        setDraftAccounts(nextList);
      } else {
        break;
      }
    }

    const visualOffset = draggedCenter - centers[curIdx];
    translateAnim.setValue(visualOffset);
  }, [translateAnim]);

  const finishIdleHold = useCallback((accId) => {
    if (draggingIdRef.current === accId && !didClaimMoveRef.current) {
      commitFinishDrag(true);
    }
  }, [commitFinishDrag]);

  const createItemResponders = useCallback((accId) => {
    const itemResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => draggingIdRef.current === accId,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        didClaimMoveRef.current = true;
        const isX = latestPropsRef.current.axis === 'x';
        const coord = isX ? evt.nativeEvent.pageX : evt.nativeEvent.pageY;
        if (typeof coord === 'number') {
          startPageCoordRef.current = coord;
        }
      },
      onPanResponderMove: (evt) => {
        didClaimMoveRef.current = true;
        handleDragMove(evt);
      },
      onPanResponderRelease: () => commitFinishDrag(false),
      onPanResponderTerminate: () => commitFinishDrag(false),
    });

    const handleResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        beginDrag(accId);
        didClaimMoveRef.current = true;
        const isX = latestPropsRef.current.axis === 'x';
        const coord = isX ? evt.nativeEvent.pageX : evt.nativeEvent.pageY;
        if (typeof coord === 'number') {
          startPageCoordRef.current = coord;
        }
      },
      onPanResponderMove: (evt) => handleDragMove(evt),
      onPanResponderRelease: () => commitFinishDrag(false),
      onPanResponderTerminate: () => commitFinishDrag(false),
    });

    return {
      itemPanHandlers: itemResponder.panHandlers,
      dragHandleHandlers: handleResponder.panHandlers,
    };
  }, [beginDrag, commitFinishDrag, handleDragMove]);

  const respondersCacheRef = useRef({});
  const getResponders = (accId) => {
    if (!respondersCacheRef.current[accId]) {
      respondersCacheRef.current[accId] = createItemResponders(accId);
    }
    return respondersCacheRef.current[accId];
  };

  const items = draftAccounts.map((acc, index) => {
    const isDragging = draggingId === acc.id;
    const { itemPanHandlers, dragHandleHandlers } = getResponders(acc.id);

    return (
      <DraggableAccountSlot
        key={acc.id}
        account={acc}
        index={index}
        axis={axis}
        isDragging={isDragging}
        translateAnim={translateAnim}
        scaleAnim={scaleAnim}
        draggingIdRef={draggingIdRef}
        itemPanHandlers={itemPanHandlers}
        registerLayout={registerLayout}
        renderItem={renderItem}
        beginDrag={beginDrag}
        finishIdleHold={finishIdleHold}
        dragHandleHandlers={dragHandleHandlers}
      />
    );
  });

  if (axis === 'x') {
    return (
      <ScrollView
        horizontal
        scrollEnabled={!draggingId}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
      >
        {items}
      </ScrollView>
    );
  }

  return <View style={contentContainerStyle}>{items}</View>;
};
