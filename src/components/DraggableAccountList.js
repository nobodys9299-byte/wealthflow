import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Animated,
  PanResponder,
  Easing,
} from 'react-native';

const DraggableAccountSlot = ({
  account,
  index,
  axis,
  isDragging,
  anyDragging,
  shiftAnim,
  scaleAnim,
  slotPanHandlers,
  dragHandleHandlers,
  registerLayout,
  renderItem,
}) => {
  return (
    <Animated.View
      collapsable={false}
      onLayout={(e) => registerLayout(account.id, e.nativeEvent.layout)}
      {...slotPanHandlers}
      style={{
        zIndex: isDragging ? 999 : anyDragging ? 0 : 1,
        elevation: isDragging ? 24 : 0,
        transform: [
          axis === 'x' ? { translateX: shiftAnim } : { translateY: shiftAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      {renderItem(account, index, {
        isDragging,
        dragHandleHandlers,
      })}
    </Animated.View>
  );
};

export const DraggableAccountList = ({
  accounts = [],
  axis = 'x', // 'x' for horizontal Dashboard carousel | 'y' for vertical Accounts tab list
  onReorder,
  onHoldWithoutDrag,
  onCardPress,
  parentScrollRef,
  contentContainerStyle,
  renderItem,
}) => {
  const [orderedAccounts, setOrderedAccounts] = useState(accounts);
  const [draggingId, setDraggingId] = useState(null);

  const orderedRef = useRef(accounts);
  const draggingIdRef = useRef(null);
  const settlingRef = useRef(false);
  const horizontalScrollRef = useRef(null);
  const layoutsRef = useRef({});
  const slotsRef = useRef([]);
  const startIndexRef = useRef(-1);
  const targetIndexRef = useRef(-1);
  const startPageCoordRef = useRef(0);
  const lastDeltaRef = useRef(0);
  const didMoveWhileDraggingRef = useRef(false);

  const shiftMapRef = useRef({});
  const scaleMapRef = useRef({});

  const getShiftAnim = (id) => {
    if (!shiftMapRef.current[id]) {
      shiftMapRef.current[id] = new Animated.Value(0);
    }
    return shiftMapRef.current[id];
  };

  const getScaleAnim = (id) => {
    if (!scaleMapRef.current[id]) {
      scaleMapRef.current[id] = new Animated.Value(1);
    }
    return scaleMapRef.current[id];
  };

  const latestPropsRef = useRef({
    onReorder,
    onHoldWithoutDrag,
    onCardPress,
    axis,
    parentScrollRef,
  });
  latestPropsRef.current = {
    onReorder,
    onHoldWithoutDrag,
    onCardPress,
    axis,
    parentScrollRef,
  };

  useEffect(() => {
    if (!draggingIdRef.current && !settlingRef.current) {
      orderedRef.current = accounts;
      setOrderedAccounts(accounts);
      accounts.forEach((a) => {
        if (shiftMapRef.current[a.id]) shiftMapRef.current[a.id].setValue(0);
        if (scaleMapRef.current[a.id]) scaleMapRef.current[a.id].setValue(1);
      });
    }
  }, [accounts]);

  const setScrollLocked = useCallback((locked) => {
    const enabled = !locked;
    try {
      horizontalScrollRef.current?.setNativeProps?.({ scrollEnabled: enabled });
    } catch (_e) {}
    try {
      latestPropsRef.current.parentScrollRef?.current?.setNativeProps?.({ scrollEnabled: enabled });
    } catch (_e) {}
  }, []);

  const registerLayout = useCallback((id, layout) => {
    if (!draggingIdRef.current && !settlingRef.current) {
      layoutsRef.current[id] = layout;
    }
  }, []);

  const updateNeighborShifts = useCallback((nextTargetIdx) => {
    const list = orderedRef.current;
    const slots = slotsRef.current;
    const startIdx = startIndexRef.current;
    if (startIdx < 0 || !slots.length) return;

    list.forEach((item, i) => {
      if (i === startIdx) return;

      let offset = 0;
      if (startIdx < nextTargetIdx && i > startIdx && i <= nextTargetIdx) {
        offset = slots[i - 1].start - slots[i].start;
      } else if (nextTargetIdx < startIdx && i >= nextTargetIdx && i < startIdx) {
        offset = slots[i + 1].start - slots[i].start;
      }

      Animated.timing(getShiftAnim(item.id), {
        toValue: offset,
        duration: 110,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const beginDrag = useCallback((accId, initialPageCoord) => {
    if (draggingIdRef.current || settlingRef.current) return;
    const list = orderedRef.current;
    const idx = list.findIndex((a) => a.id === accId);
    if (idx < 0) return;

    if (list.length < 2) {
      latestPropsRef.current.onHoldWithoutDrag?.();
      return;
    }

    const isX = latestPropsRef.current.axis === 'x';
    const fallbackStep = isX ? 186 : 210;
    slotsRef.current = list.map((item, i) => {
      const l = layoutsRef.current[item.id];
      const start = l ? (isX ? l.x : l.y) : i * fallbackStep;
      const size = l ? (isX ? l.width : l.height) : fallbackStep - 12;
      return {
        start,
        size,
        center: start + size / 2,
      };
    });

    draggingIdRef.current = accId;
    startIndexRef.current = idx;
    targetIndexRef.current = idx;
    startPageCoordRef.current = typeof initialPageCoord === 'number' ? initialPageCoord : 0;
    lastDeltaRef.current = 0;
    didMoveWhileDraggingRef.current = false;

    setScrollLocked(true);
    setDraggingId(accId);

    Animated.timing(getScaleAnim(accId), {
      toValue: 1.03,
      duration: 90,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [setScrollLocked]);

  const handleDragMove = useCallback((pageCoord) => {
    const activeId = draggingIdRef.current;
    if (!activeId || typeof pageCoord !== 'number' || Number.isNaN(pageCoord)) return;

    const slots = slotsRef.current;
    const startIdx = startIndexRef.current;
    if (startIdx < 0 || !slots.length) return;

    const minDelta = slots[0].start - slots[startIdx].start - 20;
    const maxDelta = slots[slots.length - 1].start - slots[startIdx].start + 20;
    const rawDelta = pageCoord - startPageCoordRef.current;
    const delta = Math.max(minDelta, Math.min(maxDelta, rawDelta));
    lastDeltaRef.current = delta;
    if (Math.abs(delta) >= 6) {
      didMoveWhileDraggingRef.current = true;
    }

    getShiftAnim(activeId).setValue(delta);

    const draggedCenter = slots[startIdx].center + delta;
    let curTarget = targetIndexRef.current;

    while (curTarget > 0) {
      const stepPrev = Math.abs(slots[curTarget].center - slots[curTarget - 1].center);
      const triggerPrev = slots[curTarget].center - stepPrev * 0.35;
      if (draggedCenter < triggerPrev) {
        curTarget -= 1;
      } else {
        break;
      }
    }

    while (curTarget < orderedRef.current.length - 1) {
      const stepNext = Math.abs(slots[curTarget + 1].center - slots[curTarget].center);
      const triggerNext = slots[curTarget].center + stepNext * 0.35;
      if (draggedCenter > triggerNext) {
        curTarget += 1;
      } else {
        break;
      }
    }

    if (curTarget !== targetIndexRef.current) {
      targetIndexRef.current = curTarget;
      updateNeighborShifts(curTarget);
    }
  }, [updateNeighborShifts]);

  const finishDrag = useCallback(() => {
    const activeId = draggingIdRef.current;
    if (!activeId || settlingRef.current) return;

    const list = orderedRef.current;
    const slots = slotsRef.current;
    const startIdx = startIndexRef.current;
    const endIdx = targetIndexRef.current;
    const movedWithoutSwap = !didMoveWhileDraggingRef.current && startIdx === endIdx;
    const swapped = startIdx >= 0 && endIdx >= 0 && startIdx !== endIdx;

    settlingRef.current = true;
    draggingIdRef.current = null;

    const destOffset =
      swapped && slots[endIdx] && slots[startIdx]
        ? slots[endIdx].start - slots[startIdx].start
        : 0;

    Animated.parallel([
      Animated.timing(getShiftAnim(activeId), {
        toValue: destOffset,
        duration: 95,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(getScaleAnim(activeId), {
        toValue: 1,
        duration: 95,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      list.forEach((item) => {
        getShiftAnim(item.id).setValue(0);
        getScaleAnim(item.id).setValue(1);
      });

      if (swapped) {
        const nextList = [...list];
        const [moved] = nextList.splice(startIdx, 1);
        nextList.splice(endIdx, 0, moved);
        orderedRef.current = nextList;
        setOrderedAccounts(nextList);
        latestPropsRef.current.onReorder?.(nextList);
      } else if (movedWithoutSwap) {
        latestPropsRef.current.onHoldWithoutDrag?.();
      }

      startIndexRef.current = -1;
      targetIndexRef.current = -1;
      didMoveWhileDraggingRef.current = false;
      lastDeltaRef.current = 0;
      settlingRef.current = false;
      setDraggingId(null);
      setScrollLocked(false);
    });
  }, [setScrollLocked]);

  const createSlotResponders = useCallback((acc) => {
    const accId = acc.id;
    let holdTimer = null;
    let downX = 0;
    let downY = 0;
    let cancelledTap = false;

    const clearHold = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    const getCoord = (evt) =>
      latestPropsRef.current.axis === 'x' ? evt.nativeEvent.pageX : evt.nativeEvent.pageY;

    const slotResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => !settlingRef.current,
      onPanResponderTerminationRequest: () => draggingIdRef.current !== accId,
      onPanResponderGrant: (evt) => {
        clearHold();
        cancelledTap = false;
        downX = evt.nativeEvent.pageX || 0;
        downY = evt.nativeEvent.pageY || 0;
        const startCoord = getCoord(evt);
        holdTimer = setTimeout(() => {
          holdTimer = null;
          cancelledTap = true;
          beginDrag(accId, startCoord);
        }, 200);
      },
      onPanResponderMove: (evt) => {
        if (draggingIdRef.current === accId) {
          handleDragMove(getCoord(evt));
          return;
        }
        const dx = (evt.nativeEvent.pageX || 0) - downX;
        const dy = (evt.nativeEvent.pageY || 0) - downY;
        if (Math.hypot(dx, dy) > 8) {
          clearHold();
          cancelledTap = true;
        }
      },
      onPanResponderRelease: () => {
        clearHold();
        if (draggingIdRef.current === accId) {
          finishDrag();
          return;
        }
        if (!cancelledTap) {
          const curAcc = orderedRef.current.find((item) => item.id === accId) || acc;
          latestPropsRef.current.onCardPress?.(curAcc);
        }
      },
      onPanResponderTerminate: () => {
        clearHold();
        if (draggingIdRef.current === accId) {
          finishDrag();
        }
      },
    });

    const handleResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => !settlingRef.current,
      onStartShouldSetPanResponderCapture: () => !settlingRef.current,
      onMoveShouldSetPanResponder: () => !settlingRef.current,
      onMoveShouldSetPanResponderCapture: () => !settlingRef.current,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        clearHold();
        beginDrag(accId, getCoord(evt));
      },
      onPanResponderMove: (evt) => {
        if (draggingIdRef.current === accId) {
          handleDragMove(getCoord(evt));
        }
      },
      onPanResponderRelease: () => finishDrag(),
      onPanResponderTerminate: () => finishDrag(),
    });

    return {
      slotPanHandlers: slotResponder.panHandlers,
      dragHandleHandlers: handleResponder.panHandlers,
    };
  }, [beginDrag, finishDrag, handleDragMove]);

  const respondersCacheRef = useRef({});
  const getResponders = (acc) => {
    if (!respondersCacheRef.current[acc.id]) {
      respondersCacheRef.current[acc.id] = createSlotResponders(acc);
    }
    return respondersCacheRef.current[acc.id];
  };

  const items = orderedAccounts.map((acc, index) => {
    const isDragging = draggingId === acc.id;
    const { slotPanHandlers, dragHandleHandlers } = getResponders(acc);

    return (
      <DraggableAccountSlot
        key={acc.id}
        account={acc}
        index={index}
        axis={axis}
        isDragging={isDragging}
        anyDragging={Boolean(draggingId)}
        shiftAnim={getShiftAnim(acc.id)}
        scaleAnim={getScaleAnim(acc.id)}
        slotPanHandlers={slotPanHandlers}
        dragHandleHandlers={dragHandleHandlers}
        registerLayout={registerLayout}
        renderItem={renderItem}
      />
    );
  });

  if (axis === 'x') {
    return (
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        scrollEnabled={!draggingId}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
      >
        <View collapsable={false} style={{ flexDirection: 'row', alignItems: 'center' }}>
          {items}
        </View>
      </ScrollView>
    );
  }

  return (
    <View collapsable={false} style={contentContainerStyle}>
      {items}
    </View>
  );
};
