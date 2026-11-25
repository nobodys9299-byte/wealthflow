import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../context/FinanceContext';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const YEARS = Array.from({ length: 15 }, (_, i) => 2020 + i);

export const CalendarDatePickerModal = ({ visible, onClose, onSelectDate, selectedDate }) => {
  const { theme, t } = useFinance();

  const initial = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth()); // 0-indexed
  const [pickerMode, setPickerMode] = useState('calendar'); // 'calendar' | 'month' | 'year'

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Generate calendar days
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handleDayPress = (day) => {
    const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelectDate(formatted);
    onClose();
  };

  // Check if day is today
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        {/* Backdrop: Clicking outside closes calendar */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={prevMonth} style={[styles.navBtn, { backgroundColor: theme.cardAlt }]}>
              <Ionicons name="chevron-back" size={18} color={theme.text} />
            </TouchableOpacity>

            {/* Clickable Month & Year selectors */}
            <View style={styles.headerTitleWrap}>
              <TouchableOpacity
                onPress={() => setPickerMode(pickerMode === 'month' ? 'calendar' : 'month')}
                style={[
                  styles.headerPill,
                  { backgroundColor: pickerMode === 'month' ? `${theme.primary}25` : theme.cardAlt },
                ]}
              >
                <Text style={[styles.headerPillText, { color: pickerMode === 'month' ? theme.primaryLight : theme.text }]}>
                  {MONTH_NAMES[viewMonth]}
                </Text>
                <Ionicons
                  name={pickerMode === 'month' ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color={pickerMode === 'month' ? theme.primaryLight : theme.textMuted}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPickerMode(pickerMode === 'year' ? 'calendar' : 'year')}
                style={[
                  styles.headerPill,
                  { backgroundColor: pickerMode === 'year' ? `${theme.primary}25` : theme.cardAlt },
                ]}
              >
                <Text style={[styles.headerPillText, { color: pickerMode === 'year' ? theme.primaryLight : theme.text }]}>
                  {viewYear}
                </Text>
                <Ionicons
                  name={pickerMode === 'year' ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color={pickerMode === 'year' ? theme.primaryLight : theme.textMuted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={nextMonth} style={[styles.navBtn, { backgroundColor: theme.cardAlt }]}>
              <Ionicons name="chevron-forward" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Quick Month Picker View */}
          {pickerMode === 'month' && (
            <View style={styles.pickerGrid}>
              {SHORT_MONTHS.map((m, idx) => {
                const isCurrent = idx === viewMonth;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => {
                      setViewMonth(idx);
                      setPickerMode('calendar');
                    }}
                    style={[
                      styles.pickerGridItem,
                      {
                        backgroundColor: isCurrent ? theme.primary : theme.cardAlt,
                        borderColor: isCurrent ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerGridText,
                        { color: isCurrent ? '#FFFFFF' : theme.text, fontWeight: isCurrent ? '800' : '600' },
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Quick Year Picker View */}
          {pickerMode === 'year' && (
            <ScrollView style={{ maxHeight: 220, marginVertical: 6 }} showsVerticalScrollIndicator={false}>
              <View style={styles.pickerGrid}>
                {YEARS.map((yr) => {
                  const isCurrent = yr === viewYear;
                  return (
                    <TouchableOpacity
                      key={yr}
                      onPress={() => {
                        setViewYear(yr);
                        setPickerMode('calendar');
                      }}
                      style={[
                        styles.pickerGridItem,
                        {
                          backgroundColor: isCurrent ? theme.primary : theme.cardAlt,
                          borderColor: isCurrent ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerGridText,
                          { color: isCurrent ? '#FFFFFF' : theme.text, fontWeight: isCurrent ? '800' : '600' },
                        ]}
                      >
                        {yr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Standard Days Calendar View */}
          {pickerMode === 'calendar' && (
            <>
              {/* Days of week header */}
              <View style={styles.daysRow}>
                {DAYS.map((d) => (
                  <Text key={d} style={[styles.dayLabel, { color: theme.textMuted }]}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.grid}>
                {/* Empty offset days */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <View key={`empty_${i}`} style={styles.dayCell} />
                ))}

                {/* Days in month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = selectedDate === dateStr;
                  const isToday = isCurrentMonth && today.getDate() === day;

                  return (
                    <TouchableOpacity
                      key={`day_${day}`}
                      onPress={() => handleDayPress(day)}
                      style={[
                        styles.dayCell,
                        isSelected && { backgroundColor: theme.primary },
                        isToday && !isSelected && { borderColor: theme.primaryLight, borderWidth: 1.5 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { color: isSelected ? '#FFF' : theme.text },
                          isToday && !isSelected && { color: theme.primaryLight, fontWeight: '800' },
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Bottom Cancel & Today */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => {
                const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                onSelectDate(todayFormatted);
                onClose();
              }}
              style={[styles.todayBtn, { backgroundColor: theme.cardAlt }]}
            >
              <Text style={[styles.todayBtnText, { color: theme.primaryLight }]}>{t('select_today', 'Select Today')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>{t('close', 'Close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  headerPillText: {
    fontSize: 14,
    fontWeight: '800',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  pickerGridItem: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pickerGridText: {
    fontSize: 13,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayLabel: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#64748B25',
  },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    padding: 6,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
