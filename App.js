import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, SafeAreaView } from 'react-native';

export default function App() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // আপনার দেওয়া নির্দিষ্ট ID এবং Password যাচাইকরণ
    if (userId === 'eqra1998tp' && password === 'EA705692') {
      Alert.alert('সফল লগইন', 'ইকরা একাডেমি এডমিন প্যানেলে আপনাকে স্বাগতম!');
      // পরবর্তীতে এখানে ড্যাশবোর্ড স্ক্রিন ওপেন হবে
    } else if (userId === '' || password === '') {
      Alert.alert('দুঃখিত', 'ইউজার আইডি এবং পাসওয়ার্ড দুটিই পূরণ করুন।');
    } else {
      Alert.alert('ভুল তথ্য', 'আপনার ইউজার আইডি অথবা পাসওয়ার্ড সঠিক নয়।');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* লোগো এবং হেডার এরিয়া */}
        <View style={styles.headerArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>Eqra</Text>
          </View>
          <Text style={styles.mainTitle}>Eqra Academic & Computer Coaching</Text>
          <Text style={styles.subTitle}>সংক্ষেপে: Eqra Academy</Text>
        </View>

        {/* লগইন ফর্ম এরিয়া */}
        <View style={styles.formArea}>
          <Text style={styles.panelLabel}>Admin Login Panel</Text>
          
          <TextInput
            style={styles.input}
            placeholder="User ID (যেমন: eqra1998tp)"
            placeholderTextColor="#888"
            value={userId}
            onChangeText={(text) => setUserId(text)}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry={true}
            value={password}
            onChangeText={(text) => setPassword(text)}
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>প্রবেশ করুন (Login)</Text>
          </TouchableOpacity>
        </View>

        {/* ফুটার এরিয়া */}
        <View style={styles.footerArea}>
          <Text style={styles.footerText}>পরিচালক: এস আর লোটাস</Text>
          <Text style={styles.footerText}>Help line: 01911-977800</Text>
          <Text style={styles.developerText}>Developer: Eqra Academic and Computer Coaching @2026</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#2e7d32', // সবুজ রঙের থিম লোগো ব্যাকগ্রাউন্ড
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 4,
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  formArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  panelLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerArea: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 13,
    color: '#555',
  },
  developerText: {
    fontSize: 11,
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
  },
});
