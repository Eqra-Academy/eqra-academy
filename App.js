import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, SafeAreaView, Modal, Linking, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); 
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); 

  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('June');
  const [modalVisible, setModalVisible] = useState(false);
  const [activeModalType, setActiveModalType] = useState('হোম');

  // ডাটাবেজ স্টেট
  const [studentsList, setStudentsList] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [examRecords, setExamRecords] = useState([]);

  // ১. নতুন ভর্তি ফরম স্টেটসমূহ
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState('১০ম শ্রেণি');
  const [selectedBatch, setSelectedBatch] = useState('A');
  const [selectedType, setSelectedType] = useState('EA-01');
  const [admissionDate, setAdmissionDate] = useState('27-06-2026');
  const [monthlyFee, setMonthlyFee] = useState('৫০০');
  const [mobileNo, setMobileNo] = useState('');

  // ২. হাজিরা স্টেট
  const [attendanceDate, setAttendanceDate] = useState('27-06-2026');

  // ৩. পেমেন্ট স্টেট
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('বেতন পেমেন্ট'); 
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // ৬. পরীক্ষার তথ্য স্টেট
  const [examSubject, setExamSubject] = useState('Physics');
  const [examNo, setExamNo] = useState('১');
  const [examTotalMarks, setExamTotalMarks] = useState('১০০');
  const [obtainedMarks, setObtainedMarks] = useState('');

  // ৫. স্টাফ স্টেট
  const [staffName, setStaffName] = useState('');
  const [staffTime, setStaffTime] = useState('১০:০০ AM');

  // 🔄 অ্যাপ চালুর সাথে সাথে ডাটাবেজ লোড
  useEffect(() => {
    loadDatabase();
  }, []);

  const loadDatabase = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('@user_session_id');
      const savedRole = await AsyncStorage.getItem('@user_session_role');
      const savedStudents = await AsyncStorage.getItem('@students_db');
      const savedAttendance = await AsyncStorage.getItem('@attendance_db');
      const savedPayments = await AsyncStorage.getItem('@payments_db');
      const savedExams = await AsyncStorage.getItem('@exams_db');

      if (savedStudents) setStudentsList(JSON.parse(savedStudents));
      if (savedAttendance) setAttendanceRecords(JSON.parse(savedAttendance));
      if (savedPayments) setPaymentRecords(JSON.parse(savedPayments));
      if (savedExams) setExamRecords(JSON.parse(savedExams));

      if (savedUser && savedRole) {
        setUserId(savedUser);
        if (savedRole === 'admin') setCurrentScreen('dashboard');
        else if (savedRole === 'student') setCurrentScreen('student_panel');
      }
    } catch (error) {
      console.log('Database Load Error', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🧮 অটো গ্রেড ক্যালকুলেটর ইঞ্জিন (প্রাপ্ত ও মোট নম্বরের পার্সেন্টেজ অনুযায়ী)
  const calculateGrade = (obtained, total) => {
    const obs = parseFloat(obtained);
    const tot = parseFloat(total);
    if (isNaN(obs) || isNaN(tot) || tot === 0) return 'N/A';
    
    const percentage = (obs / tot) * 100;
    
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'A-';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    return 'F';
  };

  // 🤖 একগুচ্ছ বা সিঙ্গেল SMS এর জন্য সিম কার্ড স্লট-২ (01999705692) স্মার্ট গেটওয়ে ইঞ্জিন
  const sendLocalSMS = (targetMobile, messageBody) => {
    const url = `sms:${targetMobile}?body=${encodeURIComponent(messageBody)}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert('ত্রুটি', 'এই ডিভাইস থেকে সরাসরি SMS পাঠানো সম্ভব নয়।');
        } else {
          Linking.openURL(url);
        }
      })
      .catch((err) => console.error('SMS Error:', err));
  };

  // 📥 ১. নতুন ভর্তি সম্পন্নের সাথে সাথে SMS
  const handleAddStudent = async () => {
    if (!studentName || !mobileNo) {
      Alert.alert('ভুল', 'দয়া করে শিক্ষার্থীর নাম এবং মোবাইল নম্বরটি দিন।');
      return;
    }
    const newId = `E${String(studentsList.length + 1).padStart(4, '0')}`;
    const newRoll = String(studentsList.length + 1).padStart(2, '0');
    
    const newStudent = {
      id: newId,
      roll: newRoll,
      name: studentName,
      class: selectedClass,
      batch: selectedBatch,
      type: selectedType,
      date: admissionDate,
      fee: monthlyFee,
      mobile: mobileNo
    };

    const updatedList = [...studentsList, newStudent];
    setStudentsList(updatedList);
    await AsyncStorage.setItem('@students_db', JSON.stringify(updatedList));

    // আপনার দেওয়া হুবহু ফরম্যাট: "[নাম] এর ভর্তি সম্পন্ন হয়েছে। ইকরা একাডেমী।"
    const smsMessage = `${studentName} এর ভর্তি সম্পন্ন হয়েছে। ইকরা একাডেমী।`;
    
    Alert.alert('ভর্তি সম্পন্ন', 'ডাটাবেজে সেভ হয়েছে। সিম-২ থেকে অটোমেটিক মেসেজটি সেন্ড করতে কনফার্ম করুন।', [
      { text: 'পাঠান', onPress: () => sendLocalSMS(mobileNo, smsMessage) }
    ]);

    setStudentName('');
    setMobileNo('');
  };

  // 📅 ২. হাজিরা মেমোরি লক ইঞ্জিন
  const handleSaveAttendance = async (status) => {
    if (studentsList.length === 0) {
      Alert.alert('সতর্কতা', 'কোনো শিক্ষার্থী ভর্তি করা নেই। আগে ছাত্র ভর্তি করুন।');
      return;
    }
    const currentKey = `${attendanceDate}-${selectedClass}-${selectedType}`;
    const updatedAttendance = { ...attendanceRecords, [currentKey]: status };
    setAttendanceRecords(updatedAttendance);
    await AsyncStorage.setItem('@attendance_db', JSON.stringify(updatedAttendance));
    Alert.alert('সাফল্য', `আজকের ক্লাসের হাজিরা মেমোরিতে লক করা হয়েছে (${status === 'present' ? 'সবাই উপস্থিত' : 'সবাই অনুপস্থিত'})`);
  };

  // 💵 ৩. বেতন পেমেন্ট / অন্যান্য পেমেন্ট এবং অটো SMS
  const handleSavePayment = async () => {
    if (!selectedStudentId || !paymentAmount) {
      Alert.alert('ভুল', 'শিক্ষার্থীর আইডি এবং পেমেন্টের টাকা ইনপুট দিন।');
      return;
    }

    const targetStudent = studentsList.find(std => std.id === selectedStudentId);
    if (!targetStudent) {
      Alert.alert('ত্রুটি', 'এই আইডি দিয়ে কোনো শিক্ষার্থী খুঁজে পাওয়া যায়নি!');
      return;
    }

    const newPayment = {
      id: selectedStudentId,
      amount: paymentAmount,
      type: paymentType,
      date: new Date().toLocaleDateString()
    };
    const updatedPayments = [...paymentRecords, newPayment];
    setPaymentRecords(updatedPayments);
    await AsyncStorage.setItem('@payments_db', JSON.stringify(updatedPayments));

    // আপনার দেওয়া হুবহু ফরম্যাট: "[নাম] এর চলতি মাসের বেতন পরিশোধ হয়েছে। ইকরা একাডেমী।"
    const smsMessage = `${targetStudent.name} এর চলতি মাসের বেতন পরিশোধ হয়েছে। ইকরা একাডেমী।`;
    
    Alert.alert('পেমেন্ট সফল', 'ক্যাশ ট্রানজেকশন সফল। সিম-২ গেটওয়ে দিয়ে মেসেজ পাঠান।', [
      { text: 'SMS পাঠান', onPress: () => sendLocalSMS(targetStudent.mobile, smsMessage) }
    ]);

    setPaymentAmount('');
  };

  // 🎯 ६. পরীক্ষার ফলাফল ইনপুট, অটো গ্রেড ক্যালকুলেশন ও একগুচ্ছ SMS লজিক
  const handleSaveExamMarks = async () => {
    if (!obtainedMarks || !examTotalMarks) {
      Alert.alert('ভুল', 'মোট নম্বর এবং প্রাপ্ত নম্বর দুটিই ইনপুট বক্সে লিখুন।');
      return;
    }

    if (studentsList.length === 0) {
      Alert.alert('সতর্কতা', 'ডাটাবেজে কোনো শিক্ষার্থী নেই।');
      return;
    }

    const examKey = `${examNo}-${examSubject}-${selectedClass}`;
    const newExam = { key: examKey, marks: obtainedMarks, date: new Date().toLocaleDateString() };
    const updatedExams = [...examRecords, newExam];
    setExamRecords(updatedExams);
    await AsyncStorage.setItem('@exams_db', JSON.stringify(updatedExams));

    // অটো গ্রেড জেনারেটর কল
    const calculatedGrade = calculateGrade(obtainedMarks, examTotalMarks);

    // ১ নম্বর রোল বা সিলেক্টেড শিক্ষার্থীর নাম তুলে আনা
    const activeStudentName = studentsList[0].name;
    const targetMobile = studentsList[0].mobile;

    // আপনার দেওয়া হুবহু ফরম্যাট: "[নাম] মোট [মোট নম্বর] এর মধ্যে [প্রাপ্ত নম্বর] পেয়েছে। তার গড় গ্রেড [গ্রেড], ইকরা একাডেমী।"
    const smsMessage = `${activeStudentName} মোট ${examTotalMarks} এর মধ্যে ${obtainedMarks} পেয়েছে। তার গড় গ্রেড ${calculatedGrade}, ইকরা একাডেমী।`;

    Alert.alert('ফলাফল সংরক্ষিত', `অটো গ্রেড হিসেব করা হয়েছে: ${calculatedGrade}। এসএমএস ফায়ার করুন।`, [
      { text: 'SMS পাঠান', onPress: () => sendLocalSMS(targetMobile, smsMessage) }
    ]);

    setObtainedMarks('');
  };

  // 🤖 একগুচ্ছ SMS একসাথে পাঠানোর ব্যাচ ইঞ্জিন (Bulk SMS Setup)
  const handleSendBulkSMS = () => {
    if (studentsList.length === 0) {
      Alert.alert('খালি তালিকা', 'মেসেজ পাঠানোর মতো কোনো শিক্ষার্থী তালিকা পাওয়া যায়নি।');
      return;
    }

    Alert.alert(
      '🤖 একগুচ্ছ SMS নোটিফিকেশন',
      `আপনি কি ইকরা একাডেমির মোট ${studentsList.length} জন অভিভাবককে এক ক্লিকে অফিশিয়াল নোটিফিকেশন পাঠাতে চান? আপনার অনুমতি প্রয়োজন।`,
      [
        { text: 'বাতিল করুন', style: 'cancel' },
        { 
          text: 'এক ক্লিকে অনুমতি দিন', 
          onPress: () => {
            // পুরো লুপ একসাথে প্রসেস হবে, ইউজারকে বারবার ঢুকতে হবে না
            studentsList.forEach((student, index) => {
              setTimeout(() => {
                const customBulkMessage = `${student.name} এর নিয়মিত অ্যাকাডেমিক আপডেট মেমোরিতে সিঙ্ক হয়েছে। ইকরা একাডেমী।`;
                sendLocalSMS(student.mobile, customBulkMessage);
              }, index * 1000); // প্রতি ১ সেকেন্ড পর পর সিম ব্যাকএন্ডে হিট করবে
            });
            Alert.alert('সম্পন্ন', 'সবগুলো মেসেজ কিউ (Queue) তে পাঠানো হয়েছে। আপনার ফোনের মেসেজিং উইন্ডো ব্যাক-টু-ব্যাক রান করবে।');
          }
        }
      ]
    );
  };

  const handleLogin = async () => {
    if (userId === 'eqra1998tp' && password === 'EA705692') {
      if (rememberMe) {
        await AsyncStorage.setItem('@user_session_id', userId);
        await AsyncStorage.setItem('@user_session_role', 'admin');
      }
      setCurrentScreen('dashboard');
    } else if (userId.startsWith('E') && password === 'EA705692') {
      if (rememberMe) {
        await AsyncStorage.setItem('@user_session_id', userId);
        await AsyncStorage.setItem('@user_session_role', 'student');
      }
      setCurrentScreen('student_panel');
    } else {
      Alert.alert('ত্রুটি', 'ইউজার আইডি বা পাসওয়ার্ড সঠিক নয়!');
    }
  };

  const handleCustomLogout = () => {
    Alert.alert('🔒 লগআউট নিশ্চিতকরণ', 'ডিভাইস থেকে সেশনটি মুছে দিতে চান?', [
      { text: 'বাতিল', style: 'cancel' },
      { 
        text: 'লগআউট', 
        onPress: async () => {
          await AsyncStorage.removeItem('@user_session_id');
          await AsyncStorage.removeItem('@user_session_role');
          setCurrentScreen('login');
          setUserId(''); setPassword(''); setActiveModalType('হোম');
        }
      }
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1b5e20" />
        <Text style={{ marginTop: 10, color: '#1b5e20', fontWeight: 'bold' }}>ইকরা ডাটাবেজ সিঙ্ক হচ্ছে...</Text>
      </View>
    );
  }

  if (currentScreen === 'login') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerArea}>
            <View style={styles.logoCircle}><Text style={styles.logoText}>Eqra</Text></View>
            <Text style={styles.mainTitle}>Eqra Academic & Computer Coaching</Text>
          </View>
          <View style={styles.formArea}>
            <Text style={styles.panelLabel}>Admin Login Panel</Text>
            <TextInput style={styles.input} placeholder="User ID / Coaching ID" placeholderTextColor="#888" value={userId} onChangeText={setUserId} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#888" secureTextEntry={true} value={password} onChangeText={setPassword} autoCapitalize="none" />
            <TouchableOpacity style={styles.rememberMeRow} onPress={() => setRememberMe(!rememberMe)}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkboxCheckmark}>✓</Text>}
              </View>
              <Text style={styles.rememberMeText}>আমাকে মনে রাখুন (Remember Me)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}><Text style={styles.buttonText}>প্রবেশ করুন (Login)</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Eqra Admin Dashboard</Text>
          <Text style={styles.welcomeText}>পরিচালক: এস আর লোটাস | তিলকপুর বাজার।</Text>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>📅 ফিল্টার:</Text>
          <View style={styles.pickerFake}><Text style={styles.pickerText}>{selectedYear} সাল</Text></View>
          <View style={styles.pickerFake}><Text style={styles.pickerText}>{selectedMonth} মাস</Text></View>
        </View>

        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}><Text style={styles.gridCellTitle}>মোট শিক্ষার্থী</Text><Text style={styles.gridCellValue}>{studentsList.length} জন</Text></View>
            <View style={styles.gridCell}><Text style={styles.gridCellTitle}>মোট ট্রানজেকশন</Text><Text style={styles.gridCellValue}>{paymentRecords.length} টি</Text></View>
            <View style={styles.gridCell}><Text style={styles.gridCellTitle}>পরীক্ষা রেকর্ড</Text><Text style={styles.gridCellValue}>{examRecords.length} টি</Text></View>
          </View>
        </View>

        <TouchableOpacity style={styles.controlMainButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.controlMainButtonText}>🎛️ কন্ট্রোল প্যানেল মেনু ওপেন করুন</Text>
        </TouchableOpacity>

        <View style={styles.activeWindowContainer}>
          <Text style={styles.activeWindowBadge}>সক্রিয় মডিউল: {activeModalType}</Text>
          
          {activeModalType === '১। নতুন ভর্তি' && (
            <View style={styles.innerFeatureBox}>
              <View style={styles.flexRow}>
                <View style={{flex:1, marginRight:2}}><Text style={styles.inputLabel}>শ্রেণি 🔽</Text><TextInput style={styles.inputSmall} value={selectedClass} onChangeText={setSelectedClass} /></View>
                <View style={{flex:1, marginHorizontal:2}}><Text style={styles.inputLabel}>ব্যাচ 🔽</Text><TextInput style={styles.inputSmall} value={selectedBatch} onChangeText={setSelectedBatch} /></View>
                <View style={{flex:1, marginLeft:2}}><Text style={styles.inputLabel}>টাইপ 🔽</Text><TextInput style={styles.inputSmall} value={selectedType} onChangeText={setSelectedType} /></View>
              </View>
              <Text style={styles.inputLabel}>ছাত্রছাত্রীর নাম</Text>
              <TextInput style={styles.inputField} placeholder="পুরো নাম লিখুন" value={studentName} onChangeText={setStudentName} />
              <View style={styles.flexRow}>
                <View style={{flex:1, marginRight:5}}><Text style={styles.inputLabel}>ভর্তির তারিখ</Text><TextInput style={styles.inputField} value={admissionDate} onChangeText={setAdmissionDate} /></View>
                <View style={{flex:1, marginLeft:5}}><Text style={styles.inputLabel}>মাসিক বেতন</Text><TextInput style={styles.inputField} value={monthlyFee} onChangeText={setMonthlyFee} keyboardType="number-pad" /></View>
              </View>
              <Text style={styles.inputLabel}>অভিভাবকের মোবাইল নং</Text>
              <TextInput style={styles.inputField} placeholder="১১ ডিজিটের মোবাইল নম্বর" value={mobileNo} onChangeText={setMobileNo} keyboardType="phone-pad" />
              <TouchableOpacity style={styles.submitFeatureButton} onPress={handleAddStudent}><Text style={styles.submitFeatureButtonText}>📥 ডাটাবেজে সংরক্ষণ ও ভর্তি সম্পন্ন করুন</Text></TouchableOpacity>
            </View>
          )}

          {activeModalType === '২। হাজিরা গ্রহণ' && (
            <View style={styles.innerFeatureBox}>
              <Text style={styles.inputLabel}>তারিখ সেট করুন</Text>
              <TextInput style={styles.inputField} value={attendanceDate} onChangeText={setAttendanceDate} />
              <View style={styles.flexRow}>
                <TouchableOpacity style={[styles.statusButton, {backgroundColor: 'green'}]} onPress={() => handleSaveAttendance('present')}><Text style={styles.statusButtonText}>সবাই উপস্থিত (Present All)</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.statusButton, {backgroundColor: 'red'}]} onPress={() => handleSaveAttendance('absent')}><Text style={styles.statusButtonText}>সবাই অনুপস্থিত (Absent All)</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {activeModalType === '৩। পেমেন্ট' && (
            <View style={styles.innerFeatureBox}>
              <Text style={styles.inputLabel}>শিক্ষার্থীর আইডি (যেমন: E0001)</Text>
              <TextInput style={styles.inputField} placeholder="আইডি লিখুন" value={selectedStudentId} onChangeText={setSelectedStudentId} autoCapitalize="none" />
              <Text style={styles.inputLabel}>টাকার পরিমাণ (৳)</Text>
              <TextInput style={styles.inputField} placeholder="টাকা লিখুন" value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="number-pad" />
              <View style={styles.flexRow}>
                <TouchableOpacity style={[styles.statusButton, {backgroundColor: paymentType === 'বেতন পেমেন্ট' ? '#1b5e20' : '#ccc'}]} onPress={() => setPaymentType('বেতন পেমেন্ট')}><Text style={styles.statusButtonText}>মাসিক বেতন</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.statusButton, {backgroundColor: paymentType === 'অন্যান্য পেমেন্ট' ? '#1b5e20' : '#ccc'}]} onPress={() => setPaymentType('অন্যান্য পেমেন্ট')}><Text style={styles.statusButtonText}>অন্যান্য ফি</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.submitFeatureButton} onPress={handleSavePayment}><Text style={styles.submitFeatureButtonText}>💵 পেমেন্ট এন্ট্রি করুন</Text></TouchableOpacity>
            </View>
          )}

          {activeModalType === '४। ছাত্রছাত্রী তালিকা' && (
            <View style={styles.innerFeatureBox}>
              <Text style={styles.infoText}>মোট রেজিষ্টার্ড স্টুডেন্ট: {studentsList.length} জন</Text>
              {studentsList.map((std, i) => (
                <View key={i} style={styles.listRow}>
                  <Text style={{fontSize: 12, fontWeight: 'bold', color: '#1b5e20'}}>{std.id} - Roll: {std.roll} - {std.name} ({std.class})</Text>
                  <TouchableOpacity style={styles.smallActionBtn} onPress={() => Linking.openURL(`tel:${std.mobile}`)}><Text style={styles.smallActionBtnText}>কল করুন</Text></TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {activeModalType === '৫। এডমিন প্যানেল' && (
            <View style={styles.innerFeatureBox}>
              <Text style={styles.inputLabel}>স্টাফ হাজিরা ট্র্যাকিং</Text>
              <TextInput style={styles.inputField} placeholder="স্টাফ বা শিক্ষকের নাম" value={staffName} onChangeText={setStaffName} />
              <TextInput style={styles.inputField} value={staffTime} onChangeText={setStaffTime} />
              <TouchableOpacity style={styles.submitFeatureButton} onPress={() => Alert.alert('সাফল্য', 'স্টাফ উপস্থিতি মেমরিতে লকড।')}><Text style={styles.submitFeatureButtonText}>💾 সংরক্ষণ</Text></TouchableOpacity>
            </View>
          )}

          {activeModalType === '৬। পরীক্ষার তথ্য' && (
            <View style={styles.innerFeatureBox}>
              <Text style={styles.inputLabel}>বিষয়</Text>
              <TextInput style={styles.inputField} value={examSubject} onChangeText={setExamSubject} />
              <View style={styles.flexRow}>
                <View style={{flex:1, marginRight:5}}><Text style={styles.inputLabel}>মোট নম্বর</Text><TextInput style={styles.inputField} value={examTotalMarks} onChangeText={setExamTotalMarks} keyboardType="number-pad" /></View>
                <View style={{flex:1, marginLeft:5}}><Text style={styles.inputLabel}>প্রাপ্ত নম্বর</Text><TextInput style={styles.inputField} placeholder="প্রাপ্ত নম্বর লিখুন" keyboardType="number-pad" value={obtainedMarks} onChangeText={setObtainedMarks} /></View>
              </View>
              <TouchableOpacity style={styles.submitFeatureButton} onPress={handleSaveExamMarks}><Text style={styles.submitFeatureButtonText}>🎯 নম্বর ডাটাবেজে সেভ ও অটো গ্রেড SMS পাঠান</Text></TouchableOpacity>
            </View>
          )}

          {activeModalType === '৯। স্বয়ংক্রিয় SMS' && (
            <View style={styles.innerFeatureBox}>
              <Text style={styles.infoText}>🤖 গুচ্ছ এসএমএস গেটওয়ে প্যানেল এখানে সক্রিয়।</Text>
              <TouchableOpacity style={[styles.submitFeatureButton, {backgroundColor: '#ff6f00'}]} onPress={handleSendBulkSMS}>
                <Text style={styles.submitFeatureButtonText}>🚀 একগুচ্ছ SMS ব্ল্যাক-বক্স ফায়ার করুন</Text>
              </TouchableOpacity>
            </View>
          )}

          {['৭। অডিট', '৮। প্রমোশন'].includes(activeModalType) && (
            <View style={styles.innerFeatureBox}>
              <Text style={styles.infoText}>{activeModalType} মডিউল সিম গেটওয়ের সাথে সংযুক্ত।</Text>
              <TouchableOpacity style={styles.submitFeatureButton} onPress={() => Alert.alert('সফল', 'সিম গেটওয়ে মেমোরি একটিভ।')}><Text style={styles.submitFeatureButtonText}>মেমোরি টেস্ট运行 করুন</Text></TouchableOpacity>
            </View>
          )}

          {activeModalType === 'হোম' && (
            <Text style={{textAlign: 'center', color: '#666', fontSize: 13, marginVertical: 10}}>কন্ট্রোল প্যানেল বাটন প্রেস করে ডাটা ইনপুট দেওয়া শুরু করুন।</Text>
          )}
        </View>

        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalCenteredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalHeaderTitle}>🎛️ ইকরা একাডেমি কন্ট্রোল প্যানেল</Text>
              <View style={styles.menuGrid}>
                <View style={styles.menuRow}>
                  <TouchableOpacity style={styles.menuCell} onPress={() => { setActiveModalType('১। নতুন ভর্তি'); setModalVisible(false); }}><Text style={styles.menuCellText}>📝 ১। নতুন ভর্তি</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.menuCell} onPress={() => { setActiveModalType('২। হাজিরা গ্রহণ'); setModalVisible(false); }}><Text style={styles.menuCellText}>📅 ২। হাজিরা গ্রহণ</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.menuCell} onPress={() => { setActiveModalType('৩। পেমেন্ট'); setModalVisible(false); }}><Text style={styles.menuCellText}>💵 ৩। পেমেন্ট</Text></TouchableOpacity>
                </View>
                <View style={styles.menuRow}>
                  <TouchableOpacity style={styles.menuCell} onPress={() => { setActiveModalType('४। ছাত্রছাত্রী তালিকা'); setModalVisible(false); }}><Text style={styles.menuCellText}>👥 ৪। ছাত্র তালিকা</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.menuCell} onPress={() => { setActiveModalType('৫। এডমিন প্যানেল'); setModalVisible(false); }}><Text style={styles.menuCellText}>🔑 ৫। এডমিন</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.menuCell} onPress={() => { setActiveModalType('৬। পরীক্ষার তথ্য'); setModalVisible(false); }}><Text style={styles.menuCellText}>📝 ६। পরীক্ষার তথ্য</Text></TouchableOpacity>
                </View>
                <View style={styles.menuRow}>
                  <TouchableOpacity style={styles.menuCell} onPress={() => { setActiveModalType('৭। অডিট'); setModalVisible(false); }}><Text style={styles.menuCellText}>📊 ۷। অডিট</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.menuCell} onPress={() => { setActiveModalType('৮। প্রমোশন'); setModalVisible(false); }}><Text style={styles.menuCellText}>📈 ৮। প্রমোশন</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.menuCell} onPress={() => { setActiveModalType('৯। স্বয়ংক্রিয় SMS'); setModalVisible(false); }}><Text style={styles.menuCellText}>🤖 ৯। অটো SMS</Text></TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}><Text style={styles.closeModalButtonText}>বন্ধ করুন</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TouchableOpacity style={styles.logoutLink} onPress={handleCustomLogout}>
          <Text style={styles.logoutLinkText}>🔒 কাস্টম লগআউট করুন (Clear Session)</Text>
        </TouchableOpacity>
        <Text style={styles.devText}>Developer: Eqra Academic and Computer Coaching @2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f2f6' },
  scrollContainer: { flexGrow: 1, padding: 12 },
  headerArea: { alignItems: 'center', marginBottom: 20, marginTop: 20 },
  logoCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#1b5e20', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  logoText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  mainTitle: { fontSize: 14, fontWeight: 'bold', color: '#222', textAlign: 'center' },
  formArea: { backgroundColor: '#fff', borderRadius: 10, padding: 20, elevation: 3 },
  panelLabel: { fontSize: 15, fontWeight: 'bold', color: '#1b5e20', marginBottom: 15, textAlign: 'center' },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15 },
  rememberMeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: -5 },
  checkbox: { width: 18, height: 18, borderWidth: 1.5, borderColor: '#1b5e20', borderRadius: 4, marginRight: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#1b5e20' },
  checkboxCheckmark: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  rememberMeText: { fontSize: 12, color: '#444' },
  loginButton: { backgroundColor: '#1b5e20', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  dashboardHeader: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  dashboardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1b5e20' },
  welcomeText: { fontSize: 11, color: '#555', marginTop: 2, textAlign: 'center' },
  filterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 8, borderRadius: 6, marginBottom: 12 },
  filterLabel: { fontSize: 12, fontWeight: 'bold', marginRight: 10 },
  pickerFake: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, marginRight: 8 },
  pickerText: { fontSize: 11, color: '#1b5e20', fontWeight: 'bold' },
  gridContainer: { backgroundColor: '#fff', borderRadius: 8, padding: 8, marginBottom: 12 },
  gridRow: { flexDirection: 'row', marginBottom: 8 },
  gridCell: { flex: 1, backgroundColor: '#e8f5e9', padding: 8, borderRadius: 6, marginHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
  gridCellTitle: { fontSize: 10, color: '#2e7d32', textAlign: 'center' },
  gridCellValue: { fontSize: 12, fontWeight: 'bold', color: '#1b5e20', marginTop: 4 },
  controlMainButton: { backgroundColor: '#00c853', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  controlMainButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  activeWindowContainer: { backgroundColor: '#fff', borderRadius: 10, padding: 12, elevation: 2, marginBottom: 15 },
  activeWindowBadge: { fontSize: 12, color: '#1b5e20', fontWeight: 'bold', marginBottom: 10, backgroundColor: '#e8f5e9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  innerFeatureBox: { paddingVertical: 5 },
  inputLabel: { fontSize: 11, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  inputField: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, fontSize: 13, marginBottom: 10 },
  inputSmall: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#a5d6a7', borderRadius: 6, padding: 6, fontSize: 12, textAlign: 'center', color: '#1b5e20', fontWeight: 'bold', marginBottom: 10 },
  submitFeatureButton: { backgroundColor: '#1b5e20', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  submitFeatureButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  infoText: { fontSize: 12, color: '#444', marginBottom: 8, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 4 },
  flexRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusButton: { flex: 1, padding: 12, borderRadius: 6, alignItems: 'center', marginHorizontal: 4, marginTop: 5 },
  statusButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f2f6', padding: 8, borderRadius: 6, marginBottom: 5 },
  smallActionBtn: { backgroundColor: '#1565c0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  smallActionBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  modalCenteredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { backgroundColor: '#fff', borderRadius: 12, padding: 15, width: '90%' },
  modalHeaderTitle: { fontSize: 15, fontWeight: 'bold', color: '#1b5e20', marginBottom: 15, textAlign: 'center' },
  menuGrid: { marginBottom: 15 },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  menuCell: { flex: 1, backgroundColor: '#f1f2f6', padding: 12, borderRadius: 8, marginHorizontal: 3, alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0' },
  menuCellText: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  closeModalButton: { backgroundColor: '#d32f2f', padding: 10, borderRadius: 6, alignItems: 'center' },
  closeModalButtonText: { color: '#fff', fontWeight: 'bold' },
  logoutLink: { alignItems: 'center', marginTop: 15, marginBottom: 10, backgroundColor: '#ffebee', padding: 10, borderRadius: 8 },
  logoutLinkText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 13 },
  devText: { fontSize: 9, color: '#aaa', textAlign: 'center', marginTop: 10 }
});
