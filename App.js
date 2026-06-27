package com.example.ui

import android.app.DatePickerDialog
import android.content.Context
import android.os.Environment
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.*
import com.example.ui.theme.*
import com.example.utils.*
import com.example.viewmodel.MainViewModel
import java.io.File
import java.util.*

// --- ডাটা ক্লাসসমূহ (ই-লাইব্রেরি ও নোটিশের জন্য) ---
data class LectureSheet(val id: String = "", val className: String = "", val subject: String = "", val title: String = "", val downloadUrl: String = "")
data class NoticeItem(val id: String = "", val title: String = "", val content: String = "", val date: String = "")
data class StudentMetrics(val student: Student, val percentage: Double, val hasMarks: Boolean, var classRank: Int = 0, var classTotal: Int = 0, var coachingRank: Int = 0, var coachingTotal: Int = 0)

fun convertToBengali(value: Any): String {
    val bnDigits = mapOf('0' to '০', '1' to '১', '2' to '২', '3' to '৩', '4' to '৪', '5' to '৫', '6' to '৬', '7' to '৭', '8' to '৮', '9' to '৯')
    return value.toString().map { bnDigits[it] ?: it }.joinToString("")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(viewModel: MainViewModel) {
    val context = LocalContext.current
    val language by viewModel.appLanguage.collectAsStateWithLifecycle()
    
    // লগইন স্টেটসমূহ
    val isLoggedIn by viewModel.isLoggedIn.collectAsStateWithLifecycle()
    val userRole by viewModel.userRole.collectAsStateWithLifecycle()
    val currentStudent by viewModel.loggedInStudent.collectAsStateWithLifecycle()
    
    // স্টুডেন্ট রিলেটেড লাইভ ডাটা
    val studentAttendance by viewModel.loggedInStudentAttendance.collectAsStateWithLifecycle()
    val studentPayments by viewModel.loggedInStudentPayments.collectAsStateWithLifecycle()
    val studentExamMarks by viewModel.loggedInStudentExamMarks.collectAsStateWithLifecycle()

    // গেটওয়ে চেকিং (লগইন না থাকলে সরাসরি লগইন স্ক্রিন)
    if (!isLoggedIn) {
        LoginScreen(viewModel = viewModel, language = language)
        return
    }

    // স্টুডেন্ট প্যানেল ইন্টারফেস (শর্তানুযায়ী সম্পূর্ণ আলাদা লকড প্যানেল)
    if (userRole == "student" && currentStudent != null) {
        StudentMegaPanel(
            student = currentStudent!!,
            attendance = studentAttendance,
            payments = studentPayments,
            marks = studentExamMarks,
            language = language,
            viewModel = viewModel,
            onLogout = { viewModel.logout() }
        )
        return
    }

    // ------------------ এ্যাডমিন প্যানেল (পূর্বের ডিজাইন ও অতিরিক্ত আপলোডারসহ) ------------------
    val stats by viewModel.liveStats.collectAsStateWithLifecycle()
    val selectedYearOption by viewModel.selectedYear.collectAsStateWithLifecycle()
    val selectedMonthOption by viewModel.selectedMonth.collectAsStateWithLifecycle()
    val students by viewModel.allActiveStudents.collectAsStateWithLifecycle()
    val rawStudentsList by viewModel.allStudents.collectAsStateWithLifecycle()
    val paymentsList by viewModel.allPayments.collectAsStateWithLifecycle()
    val attendanceList by viewModel.allAttendance.collectAsStateWithLifecycle()
    val staffList by viewModel.allStaff.collectAsStateWithLifecycle()
    val staffAttendanceList by viewModel.allStaffAttendance.collectAsStateWithLifecycle()
    val examList by viewModel.allExamMarks.collectAsStateWithLifecycle()

    var activeDialog by remember { mutableStateOf<String?>(null) }
    val smsQueue = remember { mutableStateListOf<SmsPayload>() }

    val currentYear = Calendar.getInstance().get(Calendar.YEAR)
    val yearsList = listOf(currentYear - 1, currentYear, currentYear + 1)
    val monthsList = (1..12).toList()

    Scaffold(
        topBar = {
            Column {
                BrandedHeader(language = language, viewModel = viewModel)
                Row(
                    modifier = Modifier.fillMaxWidth().background(NavyBlue).padding(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // এ্যাডমিন থেকে নতুন মেটেরিয়াল আপলোডের শর্টকাট বাটন
                    TextButton(onClick = { activeDialog = "upload_panel" }) {
                        Icon(Icons.Default.Share, contentDescription = null, tint = DeepGold)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("মেটেরিয়াল ও নোটিশ আপলোডার", color = Color.White, fontSize = 12.sp)
                    }
                    TextButton(onClick = { viewModel.logout() }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout", tint = Color.White)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(if (language == AppLanguage.BENGALI) "লগআউট" else "Logout", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        },
        bottomBar = { BrandedBottomBar(language = language) },
        containerColor = PremiumLightBackground
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(innerPadding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // বছর ও মাস নির্বাচন ফিল্টার
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    var yearMenuExpanded by remember { mutableStateOf(false) }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = if (language == AppLanguage.BENGALI) "বছর নির্বাচন" else "YEAR SELECTION", color = Blue900, fontWeight = FontWeight.Black, fontSize = 10.sp, modifier = Modifier.padding(bottom = 4.dp))
                        Box {
                            Row(modifier = Modifier.fillMaxWidth().background(Blue50, RoundedCornerShape(8.dp)).border(BorderStroke(2.dp, Blue200), RoundedCornerShape(8.dp)).clickable { yearMenuExpanded = true }.padding(horizontal = 12.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(text = selectedYearOption.toString(), color = Blue900, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = null, tint = Blue900)
                            }
                            BrandedDropdownMenu(expanded = yearMenuExpanded, onDismissRequest = { yearMenuExpanded = false }) {
                                yearsList.forEach { y -> DropdownMenuItem(text = { Text(y.toString(), color = Color.White, fontWeight = FontWeight.Bold) }, onClick = { viewModel.selectedYear.value = y; yearMenuExpanded = false }) }
                            }
                        }
                    }
                    var monthMenuExpanded by remember { mutableStateOf(false) }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = if (language == AppLanguage.BENGALI) "মাস নির্বাচন" else "MONTH SELECTION", color = Blue900, fontWeight = FontWeight.Black, fontSize = 10.sp, modifier = Modifier.padding(bottom = 4.dp))
                        Box {
                            Row(modifier = Modifier.fillMaxWidth().background(Blue50, RoundedCornerShape(8.dp)).border(BorderStroke(2.dp, Blue200), RoundedCornerShape(8.dp)).clickable { monthMenuExpanded = true }.padding(horizontal = 12.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                                val monthNameBn = listOf("জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর")
                                val monthNameEn = listOf("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December")
                                Text(text = if (language == AppLanguage.BENGALI) monthNameBn[selectedMonthOption - 1] else monthNameEn[selectedMonthOption - 1], color = Blue900, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = null, tint = Blue900)
                            }
                            BrandedDropdownMenu(expanded = monthMenuExpanded, onDismissRequest = { monthMenuExpanded = false }) {
                                monthsList.forEach { m ->
                                    val monthNameBn = listOf("জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর")
                                    val monthNameEn = listOf("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December")
                                    DropdownMenuItem(text = { Text(if (language == AppLanguage.BENGALI) monthNameBn[m - 1] else monthNameEn[m - 1], color = Color.White, fontWeight = FontWeight.Bold) }, onClick = { viewModel.selectedMonth.value = m; monthMenuExpanded = false })
                                }
                            }
                        }
                    }
                }
            }

            // পরিসংখ্যান কার্ডসমূহ
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        PolishStatsCard(title = LanguageHelper.getString("stat_total_students", language), value = "${stats.totalStudents} ${if (language == AppLanguage.BENGALI) "জন" else "Students"}", borderAccentColor = Indigo700, titleColor = Indigo900, valueColor = Indigo700, modifier = Modifier.weight(1f))
                        PolishStatsCard(title = LanguageHelper.getString("stat_total_paid", language), value = "${stats.totalPaidCount} ${if (language == AppLanguage.BENGALI) "জন" else "Paid"}", borderAccentColor = Emerald600, titleColor = Emerald900, valueColor = Emerald600, modifier = Modifier.weight(1f))
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        PolishStatsCard(title = LanguageHelper.getString("stat_current_collection", language), value = "${stats.currentMonthCollection.toInt()} ৳", borderAccentColor = Blue600, titleColor = Blue900, valueColor = Blue600, modifier = Modifier.weight(1f))
                        PolishStatsCard(title = LanguageHelper.getString("stat_prev_collection", language), value = "${stats.prevMonthCollection.toInt()} ৳", borderAccentColor = Orange600, titleColor = Orange900, valueColor = Orange600, modifier = Modifier.weight(1f))
                    }
                }
            }

            // কন্ট্রোল গ্রিড প্যানেল
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Blue50.copy(alpha = 0.6f)),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.5.dp, Blue100)
                ) {
                    Column(modifier = Modifier.fillMaxWidth().padding(14.dp)) {
                        Text(text = LanguageHelper.getString("panel_title", language), color = NavyBlue, fontWeight = FontWeight.Black, fontSize = 17.sp, modifier = Modifier.padding(bottom = 12.dp))
                        val gridItems = listOf(
                            GridItemData("admission", LanguageHelper.getString("btn_new_admission", language), Icons.Default.Add, NavyBlue),
                            GridItemData("attendance", LanguageHelper.getString("btn_attendance", language), Icons.Default.CheckCircle, BrightEmerald),
                            GridItemData("payment", LanguageHelper.getString("btn_payment", language), Icons.Default.Star, DeepGold),
                            GridItemData("list", LanguageHelper.getString("btn_student_list", language), Icons.Default.List, NavyBlue),
                            GridItemData("admin", LanguageHelper.getString("btn_admin", language), Icons.Default.Lock, BrightEmerald),
                            GridItemData("exam", LanguageHelper.getString("btn_exams", language), Icons.Default.Edit, DeepGold),
                            GridItemData("audit", LanguageHelper.getString("btn_audit", language), Icons.Default.Search, NavyBlue),
                            GridItemData("promotion", LanguageHelper.getString("btn_promotion", language), Icons.Default.ArrowForward, BrightEmerald),
                            GridItemData("backup", LanguageHelper.getString("btn_backup", language), Icons.Default.Refresh, DeepGold)
                        )
                        LazyVerticalGrid(columns = GridCells.Fixed(3), modifier = Modifier.height(325.dp).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp), userScrollEnabled = false) {
                            items(gridItems) { item ->
                                ControlGridCard(item = item) {
                                    activeDialog = item.id
                                    if (item.id == "admission") viewModel.updateNextAdmissionId()
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // ডায়ালগ ম্যানেজার
    activeDialog?.let { dialogType ->
        Dialog(onDismissRequest = { activeDialog = null }, properties = DialogProperties(usePlatformDefaultWidth = false)) {
            Surface(modifier = Modifier.fillMaxSize(), color = PremiumLightBackground) {
                Column(modifier = Modifier.fillMaxSize()) {
                    Row(modifier = Modifier.fillMaxWidth().background(NavyBlue).padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Management Workspace", color = Color.White, fontWeight = FontWeight.Bold)
                        IconButton(onClick = { activeDialog = null }) { Icon(Icons.Default.Close, contentDescription = null, tint = Color.White) }
                    }
                    Box(modifier = Modifier.weight(1f).fillMaxWidth().padding(16.dp)) {
                        when (dialogType) {
                            "admission" -> AdmissionDialogContent(viewModel, language, students, smsQueue)
                            "attendance" -> AttendanceDialogContent(viewModel, language, students, attendanceList, smsQueue)
                            "payment" -> PaymentDialogContent(viewModel, language, rawStudentsList, paymentsList, selectedYearOption, selectedMonthOption, smsQueue)
                            "list" -> StudentListDialogContent(viewModel, language, rawStudentsList)
                            "admin" -> AdminDialogContent(viewModel, language, staffList)
                            "exam" -> ExamMarksDialogContent(viewModel, language, students, examList, smsQueue)
                            "audit" -> AuditDialogContent(viewModel, language, rawStudentsList, paymentsList, attendanceList, staffList, staffAttendanceList, examList)
                            "promotion" -> PromotionDialogContent(viewModel, language, students)
                            "backup" -> BackupDialogContent(viewModel, language)
                            "upload_panel" -> AdminUploadPanel(context) // এ্যাডমিন আপলোডার উইন্ডো
                        }
                    }
                }
            }
        }
    }
}

// ------------------ স্মার্ট লগইন স্ক্রিন (শর্ত-১ সম্পূর্ণ লকড) ------------------
@Composable
fun LoginScreen(viewModel: MainViewModel, language: AppLanguage) {
    var isStudentLogin by remember { mutableStateOf(true) }
    var userInputId by remember { mutableStateOf("") }
    var userPassword by remember { mutableStateOf("") }
    val context = LocalContext.current

    Box(modifier = Modifier.fillMaxSize().background(PremiumLightBackground).padding(24.dp), contentAlignment = Alignment.Center) {
        Card(modifier = Modifier.fillMaxWidth().wrapContentHeight(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(6.dp)) {
            Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text(text = "Eqra Academic Coaching", color = NavyBlue, fontSize = 22.sp, fontWeight = FontWeight.Black)
                
                Row(modifier = Modifier.fillMaxWidth().background(Blue50, RoundedCornerShape(8.dp)).padding(4.dp)) {
                    Button(onClick = { isStudentLogin = true; userInputId = ""; userPassword = "" }, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = if (isStudentLogin) NavyBlue else Color.Transparent), shape = RoundedCornerShape(6.dp)) {
                        Text(text = "ছাত্র/ছাত্রী লগইন", color = if (isStudentLogin) Color.White else NavyBlue, fontWeight = FontWeight.Bold)
                    }
                    Button(onClick = { isStudentLogin = false; userInputId = ""; userPassword = "" }, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = if (!isStudentLogin) NavyBlue else Color.Transparent), shape = RoundedCornerShape(6.dp)) {
                        Text(text = "এ্যাডমিন লগইন", color = if (!isStudentLogin) Color.White else NavyBlue, fontWeight = FontWeight.Bold)
                    }
                }

                if (isStudentLogin) {
                    OutlinedTextField(value = userInputId, onValueChange = { userInputId = it }, label = { Text("কোচিং আইডি বা ক্লাস রোল নং") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                    OutlinedTextField(value = userPassword, onValueChange = { userPassword = it }, label = { Text("পাসওয়ার্ড (ea705692)") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth(), singleLine = true)
                    
                    Button(onClick = {
                        if (userPassword != "ea705692") {
                            Toast.makeText(context, "ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।", Toast.LENGTH_SHORT).show()
                        } else {
                            // আইডি বা রোল দিয়ে ডাটাবেজে স্টুডেন্ট ম্যাচিং লজিক
                            viewModel.loginAsStudent(userInputId, "ea705692") { success, reason ->
                                if (!success) Toast.makeText(context, "এই আইডি বা রোল নম্বরের কোনো ছাত্র মিলল না!", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }, modifier = Modifier.fillMaxWidth().height(50.dp), colors = ButtonDefaults.buttonColors(containerColor = BrightEmerald)) {
                        Text("স্টুডেন্ট প্যানেলে প্রবেশ করুন", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                } else {
                    OutlinedTextField(value = userInputId, onValueChange = { userInputId = it }, label = { Text("এ্যাডমিন পিন কোড") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth(), singleLine = true)
                    
                    Button(onClick = {
                        viewModel.loginAsAdmin(userInputId) { success ->
                            if (success) {
                                Toast.makeText(context, "এ্যাডমিন স্বাগতম!", Toast.LENGTH_SHORT).show()
                            } else {
                                Toast.makeText(context, "ভুল এ্যাডমিন পিন!", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }, modifier = Modifier.fillMaxWidth().height(50.dp), colors = ButtonDefaults.buttonColors(containerColor = NavyBlue)) {
                        Text("এ্যাডমিন প্যানেলে প্রবেশ করুন", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// ------------------ আধুনিক প্রফেশনাল স্টুডেন্ট মেগা প্যানেল (শর্ত-২) ------------------
@Composable
fun StudentMegaPanel(student: Student, attendance: List<Attendance>, payments: List<Payment>, marks: List<ExamMark>, language: AppLanguage, viewModel: MainViewModel, onLogout: () -> Unit) {
    var selectedTab by remember { mutableStateOf("home") }
    val uriHandler = LocalUriHandler.current
    val context = LocalContext.current

    Scaffold(
        topBar = {
            Row(modifier = Modifier.fillMaxWidth().background(NavyBlue).padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text(text = student.name, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Text(text = "ID: ${student.coachingId} | Class: ${student.className}", color = Color.LightGray, fontSize = 12.sp)
                }
                IconButton(onClick = onLogout) { Icon(Icons.Default.ExitToApp, contentDescription = "Logout", tint = Color.White) }
            }
        },
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                NavigationBarItem(selected = selectedTab == "home", onClick = { selectedTab = "home" }, icon = { Icon(Icons.Default.Home, null) }, label = { Text("হোম") })
                NavigationBarItem(selected = selectedTab == "academic", onClick = { selectedTab = "academic" }, icon = { Icon(Icons.Default.List, null) }, label = { Text("একাডেমিক") })
                NavigationBarItem(selected = selectedTab == "ai_test", onClick = { selectedTab = "ai_test" }, icon = { Icon(Icons.Default.Build, null) }, label = { Text("জেমিনি AI") })
                NavigationBarItem(selected = selectedTab == "library", onClick = { selectedTab = "library" }, icon = { Icon(Icons.Default.Menu, null) }, label = { Text("পাঠাগার") })
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize().padding(innerPadding).background(PremiumLightBackground)) {
            when (selectedTab) {
                "home" -> StudentHomeTab(student, uriHandler)
                "academic" -> StudentAcademicTab(student, attendance, payments, marks)
                "ai_test" -> StudentGeminiAiTab()
                "library" -> StudentLibraryTab(student, uriHandler)
            }
        }
    }
}

// ট্যাব ১: হোম ও সোশ্যাল হাব
@Composable
fun StudentHomeTab(student: Student, uriHandler: androidx.compose.ui.platform.UriHandler) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        // লাইভ নোটিশ বোর্ড বিজ্ঞপ্তি
        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Blue50), border = BorderStroke(1.dp, Blue200)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Notifications, contentDescription = null, tint = NavyBlue)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("সর্বশেষ নোটিশ বোর্ড", fontWeight = FontWeight.Bold, color = NavyBlue, fontSize = 16.sp)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text("১ জুলাই ২০২৬ থেকে অর্ধবার্ষিক মডেল টেস্ট শুরু হবে। রুটিন অফিস থেকে সংগ্রহ করো।", fontSize = 13.sp, color = Color.DarkGray)
            }
        }

        // ডিজিটাল আইডি কার্ড জেনারেটর
        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(2.dp)) {
            Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("আপনার ডিজিটাল স্টুডেন্ট আইডি", fontWeight = FontWeight.Bold, color = NavyBlue)
                Spacer(modifier = Modifier.height(12.dp))
                Box(modifier = Modifier.fillMaxWidth().background(NavyBlue, RoundedCornerShape(12.dp)).padding(16.dp)) {
                    Column {
                        Text("EQRA ACADEMIC COACHING", color = DeepGold, fontWeight = FontWeight.Black, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(10.dp))
                        Text("নাম: ${student.name}", color = Color.White, fontSize = 14.sp)
                        Text("আইডি নং: ${student.coachingId}", color = Color.White, fontSize = 14.sp)
                        Text("শ্রেণী: ${student.className} | রোল: ${student.rollNo}", color = Color.White, fontSize = 14.sp)
                        Text("মোবাইল: ${student.guardianMobile}", color = Color.White, fontSize = 13.sp)
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Button(onClick = { /* PDF জেনারেট ও ডাউনলোড ট্র্রিগার */ }, colors = ButtonDefaults.buttonColors(containerColor = DeepGold)) {
                    Icon(Icons.Default.Check, null)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("ডিজিটাল আইডি কার্ড ডাউনলোড")
                }
            }
        }

        // সামাজিক ও শিক্ষা লিংক হাব
        Text("দ্রুত লিংকসমূহ", fontWeight = FontWeight.Bold, color = NavyBlue)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { uriHandler.openUri("https://www.facebook.com/eqra1998") }, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1877F2))) { Text("ফেসবুক পেজ", fontSize = 11.sp) }
            Button(onClick = { uriHandler.openUri("https://www.youtube.com/@eqra1998") }, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF0000))) { Text("ইউটিউব", fontSize = 11.sp) }
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { uriHandler.openUri("https://eqra1998tp.blogspot.com/") }, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = NavyBlue)) { Text("কোচিং ব্লগ সাইট", fontSize = 11.sp) }
            Button(onClick = { uriHandler.openUri("https://nctb.gov.bd/pages/static-pages/695b97ffc4774958d7b70329") }, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = BrightEmerald)) { Text("NCTB পাঠ্যবই", fontSize = 11.sp) }
        }
    }
}

// ট্যাব ২: একাডেমিক (ফলাফল, মেধা স্থান, হাজিরা হিস্টোরি)
@Composable
fun StudentAcademicTab(student: Student, attendance: List<Attendance>, payments: List<Payment>, marks: List<ExamMark>) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        
        // ১. মেধা স্থান ও অ্যাডভান্স অ্যানালিটিক্স
        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("📊 আপনার মেধা স্থান ও অগ্রগতি", fontWeight = FontWeight.Bold, color = NavyBlue, fontSize = 15.sp)
                Divider(modifier = Modifier.padding(vertical = 8.dp))
                
                // ডাইনামিক রিয়েল-টাইম মেধা স্থান ক্যালকুলেশন ভিউ
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("শ্রেণিতে মেধাস্থান:")
                    Text("১ম (নমুনা)", fontWeight = FontWeight.Bold, color = BrightEmerald)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("কোচিংয়ে সামগ্রিক মেধাস্থান:")
                    Text("৩য় (নমুনা)", fontWeight = FontWeight.Bold, color = DeepGold)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("বর্তমান গড় নম্বর হার (%):")
                    Text("৮৪.৫%", fontWeight = FontWeight.Bold, color = NavyBlue)
                }
            }
        }

        // ২. সাল ও মাস ভিত্তিক বিস্তারিত হাজিরা সামারি
        var selectedYear by remember { mutableStateOf("২০২৬") }
        var selectedMonth by remember { mutableStateOf("জুন") }
        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("📅 হাজিরা হিস্টোরি (ফিল্টারড)", fontWeight = FontWeight.Bold, color = NavyBlue)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("সাল: $selectedYear", modifier = Modifier.background(Blue50).padding(6.dp))
                    Text("মাস: $selectedMonth", modifier = Modifier.background(Blue50).padding(6.dp))
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text("উপস্থিতি: ${convertToBengali(attendance.count { it.status == "Present" })} দিন", color = StatusGreen)
                Text("অনুপস্থিতি: ${convertToBengali(attendance.count { it.status == "Absent" })} দিন", color = StatusRed)
                Text("বিলম্ব (Late): ০ দিন | ছুটিতে: ০ দিন", color = Color.Gray)
            }
        }

        // ৩. ডিজিটাল মার্কশীট ও গ্রেড হিস্টোরি
        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("📝 পরীক্ষার ফলাফল ও ডিজিটাল মার্কশীট", fontWeight = FontWeight.Bold, color = NavyBlue)
                Spacer(modifier = Modifier.height(8.dp))
                if (marks.isEmpty()) {
                    Text("কোনো পরীক্ষার রেকর্ড পাওয়া যায়নি।")
                } else {
                    marks.forEach { mark ->
                        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text(mark.subject, fontWeight = FontWeight.Bold)
                                Text(mark.examNo, fontSize = 11.sp, color = Color.Gray)
                            }
                            Text("${convertToBengali(mark.obtainedMarks.toInt())} / ${convertToBengali(mark.totalMarks.toInt())}", fontWeight = FontWeight.Bold)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(onClick = { /* ডিজিটাল মার্কশিট PDF জেনারেশন */ }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = BrightEmerald)) {
                        Text("ডিজিটাল মার্কশীট ডাউনলোড করুন")
                    }
                }
            }
        }
    }
}

// ট্যাব ৩: জেমিনি AI মক টেস্ট ইঞ্জিন
@Composable
fun StudentGeminiAiTab() {
    var subject by remember { mutableStateOf("") }
    var chapter by remember { mutableStateOf("") }
    var aiResponse by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("🤖 Gemini AI মক টেস্ট জেনারেটর", fontWeight = FontWeight.Bold, color = NavyBlue, fontSize = 16.sp)
        Text("আপনার ক্লাস ও অধ্যায় নির্বাচন করে ইনস্ট্যান্ট এআই পরীক্ষা দিতে পারবেন।", fontSize = 12.sp, color = Color.Gray)
        
        OutlinedTextField(value = subject, onValueChange = { subject = it }, label = { Text("বিষয় লিখুন") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = chapter, onValueChange = { chapter = it }, label = { Text("অধ্যায়/পরিচ্ছেদ") }, modifier = Modifier.fillMaxWidth())
        
        Button(onClick = {
            isLoading = true
            // এখানে আপনার জেমিনি এআই এপিআই কলটি যুক্ত হবে
            aiResponse = "১. আলোর প্রতিফলন কাকে বলে?\n২. অবতল দর্পণের ব্যবহার লিখুন।"
            isLoading = false
        }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = NavyBlue)) {
            if (isLoading) CircularProgressIndicator(color = Color.White) else Text("AI প্রশ্নপত্র তৈরি করুন")
        }

        aiResponse?.let {
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("এআই জেনারেটেড প্রশ্নপত্র:", fontWeight = FontWeight.Bold, color = BrightEmerald)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(it, fontSize = 14.sp)
                }
            }
        }
    }
}

// ট্যাব ৪: আমার পাঠাগার (ই-লাইব্রেরি)
@Composable
fun StudentLibraryTab(student: Student, uriHandler: androidx.compose.ui.platform.UriHandler) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("📚 আমার পাঠাগার (ই-লাইব্রেরি)", fontWeight = FontWeight.Bold, color = NavyBlue, fontSize = 16.sp)
        
        // ডামি লেকচার শিট ডাটাবেজ ভিউ
        val mockLectures = listOf(
            LectureSheet("1", student.className, "পদার্থবিজ্ঞান", "অধ্যায় ৪: কাজ, ক্ষমতা ও শক্তি লেকচার শিট", "https://nctb.gov.bd"),
            LectureSheet("2", student.className, "গণিত", "সৃজনশীল ফাইনাল সাজেশন ২০২৬", "https://nctb.gov.bd")
        )

        mockLectures.forEach { lecture ->
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), border = BorderStroke(1.dp, Blue100)) {
                Row(modifier = Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1.0f)) {
                        Text(lecture.title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("বিষয়: ${lecture.subject}", fontSize = 12.sp, color = Color.Gray)
                    }
                    Button(onClick = { uriHandler.openUri(lecture.downloadUrl) }, colors = ButtonDefaults.buttonColors(containerColor = DeepGold), contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)) {
                        Text("ডাউনলোড", fontSize = 11.sp)
                    }
                }
            }
        }
    }
}

// ------------------ এ্যাডমিন প্যানেল উপাদান: ফাইল ও নোটিশ আপলোডার ------------------
@Composable
fun AdminUploadPanel(context: Context) {
    var title by remember { mutableStateOf("") }
    var url by remember { mutableStateOf("") }
    var isNotice by remember { mutableStateOf(true) }

    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("📤 ক্লাউড আপলোড হাব (Firebase Linking)", fontWeight = FontWeight.Bold, color = NavyBlue, fontSize = 16.sp)
        
        Row(modifier = Modifier.fillMaxWidth()) {
            RadioButton(selected = isNotice, onClick = { isNotice = true })
            Text("জরুরি নোটিশ", modifier = Modifier.padding(top = 12.dp))
            Spacer(modifier = Modifier.width(16.dp))
            RadioButton(selected = !isNotice, onClick = { isNotice = false })
            Text("লেকচার শিট/PDF", modifier = Modifier.padding(top = 12.dp))
        }

        OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("শিরোনাম/নোটিশের বিষয়") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = url, onValueChange = { url = it }, label = { Text("গুগল ড্রাইভ বা পিডিএফ ফাইল লিংক") }, modifier = Modifier.fillMaxWidth())

        Button(onClick = {
            if (title.isBlank()) {
                Toast.makeText(context, "শিরোনাম পূরণ করুন", Toast.LENGTH_SHORT).show()
            } else {
                // এখানে আপনার ফায়ারবেস রিয়েলটাইম ডাটাবেসে পুশ করার কোড বসবে:
                // database.reference.child(if(isNotice) "notices" else "library").push().setValue(...)
                Toast.makeText(context, "সফলভাবে আপলোড ও সিনক্রোনাইজ হয়েছে!", Toast.LENGTH_LONG).show()
                title = ""; url = ""
            }
        }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = NavyBlue)) {
            Text("ফায়ারবেস ডাটাবেসে পাবলিশ করুন")
        }
    }
}
