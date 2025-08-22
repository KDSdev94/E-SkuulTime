import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSafeFont } from '../utils/fontUtils';
import ProtectedComponent from './ProtectedComponent';
import PermissionService from '../services/PermissionService';

const DataTable = ({ 
  data, 
  columns, 
  onEdit, 
  onDelete, 
  onSelectAll, 
  onSelectItem, 
  selectedItems = new Set(), 
  selectAll = false,
  emptyMessage = "Belum ada data",
  searchQuery = "",
  refreshControl = null
}) => {
  const getItemLayout = useCallback((data, index) => ({
    length: 80, // Fixed row height
    offset: 80 * index,
    index,
  }), []);

  const keyExtractor = useCallback((item) => item.id, []);

  const renderTableHeader = () => {
    return (
      <View style={styles.tableHeader}>
        {/* Checkbox Column */}
        <View style={[styles.tableCell, styles.checkboxCell]}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={onSelectAll}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, selectAll && styles.checkboxChecked]}>
              {selectAll && <Ionicons name="checkmark" size={16} color="#ffffff" />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Dynamic columns */}
        {columns.map((column, index) => (
          <View key={index} style={[styles.tableCell, column.style]}>
            <Text style={styles.tableHeaderText}>{column.title}</Text>
          </View>
        ))}

        {/* Action Column */}
        <View style={[styles.tableCell, styles.actionCell]}>
          <Text style={styles.tableHeaderText}>Aksi</Text>
        </View>
      </View>
    );
  };

  const renderTableRow = useCallback(({ item }) => {
    const isSelected = selectedItems.has(item.id);
    
    return (
      <View style={[styles.tableRow, isSelected && styles.selectedRow]}>
        {/* Checkbox Column */}
        <View style={[styles.tableCell, styles.checkboxCell]}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => onSelectItem(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Dynamic columns */}
        {columns.map((column, index) => (
          <View key={index} style={[styles.tableCell, column.style]}>
            {column.render ? column.render(item) : (
              <Text style={styles.tableCellText} numberOfLines={column.numberOfLines || 1}>
                {item[column.key] || '-'}
              </Text>
            )}
          </View>
        ))}

        {/* Action Column */}
        <View style={[styles.tableCell, styles.actionCell]}>
          <View style={styles.actionButtons}>
            <ProtectedComponent permission={PermissionService.PERMISSIONS.EDIT_DATA} showFallback={false}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => onEdit(item)}
              >
                <Ionicons name="create" size={16} color="white" />
              </TouchableOpacity>
            </ProtectedComponent>
            <ProtectedComponent permission={PermissionService.PERMISSIONS.DELETE_DATA} showFallback={false}>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => onDelete(item.id)}
              >
                <Ionicons name="trash" size={16} color="white" />
              </TouchableOpacity>
            </ProtectedComponent>
          </View>
        </View>
      </View>
    );
  }, [selectedItems, columns, onEdit, onDelete, onSelectItem]);

  return (
    <View style={styles.tableContainer}>
      <ScrollView 
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.tableContent}>
          {renderTableHeader()}
          <FlatList
            data={data}
            renderItem={renderTableRow}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            extraData={selectedItems}
            contentContainerStyle={data.length === 0 ? styles.emptyListContainer : styles.listContainer}
            showsVerticalScrollIndicator={true}
            refreshControl={refreshControl}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people" size={80} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Tidak ada data yang ditemukan' : emptyMessage}
                </Text>
              </View>
            }
            initialNumToRender={15}
            windowSize={10}
            maxToRenderPerBatch={15}
            updateCellsBatchingPeriod={100}
            removeClippedSubviews={true}
            nestedScrollEnabled={true}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginHorizontal: 0,
    marginTop: 0,
    borderRadius: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 0,
  },
  tableContent: {
    minWidth: 770, // Minimum width to accommodate all columns
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  tableHeaderText: {
    fontSize: 13,
    fontFamily: getSafeFont('Nunito_700Bold'),
    color: '#374151',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 80, // Fixed height for getItemLayout optimization
  },
  tableCell: {
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  checkboxCell: {
    width: 50,
    alignItems: 'center',
  },
  actionCell: {
    width: 100,
    alignItems: 'center',
    borderRightWidth: 0, // Remove right border for last column
  },
  selectedRow: {
    backgroundColor: '#f0f9ff',
  },
  checkboxContainer: {
    padding: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  tableCellText: {
    fontSize: 12,
    fontFamily: getSafeFont('Nunito_500Medium'),
    color: '#374151',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: getSafeFont('Nunito_500Medium'),
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
  },
});

export default DataTable;
