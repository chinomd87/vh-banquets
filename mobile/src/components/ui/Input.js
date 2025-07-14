import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Input = ({ 
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  maxLength,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainer_focused,
        error && styles.inputContainer_error,
        !editable && styles.inputContainer_disabled
      ]}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.input_multiline,
            inputStyle
          ]}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={togglePasswordVisibility}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#8E8E93"
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  inputContainer_focused: {
    borderColor: '#007AFF',
  },
  inputContainer_error: {
    borderColor: '#FF3B30',
  },
  inputContainer_disabled: {
    backgroundColor: '#F2F2F7',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input_multiline: {
    textAlignVertical: 'top',
    minHeight: 88,
  },
  eyeIcon: {
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
});

export default Input;
