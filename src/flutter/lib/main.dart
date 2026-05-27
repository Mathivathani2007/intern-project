import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: firebaseOptions);
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Firebase Starter',
      theme: ThemeData.dark().copyWith(
        colorScheme: ColorScheme.dark(primary: Colors.blueAccent),
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final FirebaseAuth auth = FirebaseAuth.instance;
  final FirebaseFirestore firestore = FirebaseFirestore.instance;
  final FirebaseDatabase realtimeDatabase = FirebaseDatabase.instance;

  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController codeController = TextEditingController();
  final TextEditingController displayNameController = TextEditingController();
  final TextEditingController roleController = TextEditingController();
  final TextEditingController companyController = TextEditingController();
  final TextEditingController realtimeMessageController = TextEditingController();

  String statusMessage = 'Ready';
  String liveMessage = 'No message stored yet.';
  String verificationId = '';
  User? currentUser;

  @override
  void initState() {
    super.initState();
    auth.userChanges().listen((user) {
      setState(() {
        currentUser = user;
      });
      if (user != null) {
        _loadUserProfile();
        _listenRealtimeValue();
      }
    });
  }

  Future<void> _loadUserProfile() async {
    if (currentUser == null) return;

    final doc = await firestore.collection('users').doc(currentUser!.uid).get();
    if (doc.exists) {
      final data = doc.data();
      displayNameController.text = data?['displayName'] ?? '';
      roleController.text = data?['role'] ?? '';
      companyController.text = data?['company'] ?? '';
    }
  }

  Future<void> _listenRealtimeValue() async {
    if (currentUser == null) return;
    final reference = realtimeDatabase.ref('users/${currentUser!.uid}/realtimeMessage');
    reference.onValue.listen((event) {
      setState(() {
        liveMessage = event.snapshot.value?.toString() ?? 'No message stored yet.';
      });
    });
  }

  Future<void> _signUpWithEmail() async {
    try {
      final credential = await auth.createUserWithEmailAndPassword(
        email: emailController.text.trim(),
        password: passwordController.text.trim(),
      );
      await firestore.collection('users').doc(credential.user!.uid).set({
        'email': credential.user!.email,
        'createdAt': DateTime.now().toIso8601String(),
      });
      setState(() => statusMessage = 'Signed up successfully.');
    } catch (e) {
      setState(() => statusMessage = 'Sign up failed: $e');
    }
  }

  Future<void> _signInWithEmail() async {
    try {
      await auth.signInWithEmailAndPassword(
        email: emailController.text.trim(),
        password: passwordController.text.trim(),
      );
      setState(() => statusMessage = 'Signed in successfully.');
    } catch (e) {
      setState(() => statusMessage = 'Sign in failed: $e');
    }
  }

  Future<void> _signInWithGoogle() async {
    try {
      final googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) {
        setState(() => statusMessage = 'Google sign-in cancelled.');
        return;
      }
      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      final result = await auth.signInWithCredential(credential);
      final docRef = firestore.collection('users').doc(result.user!.uid);
      final snapshot = await docRef.get();
      if (!snapshot.exists) {
        await docRef.set({
          'email': result.user!.email,
          'displayName': result.user!.displayName,
          'createdAt': DateTime.now().toIso8601String(),
        });
      }
      setState(() => statusMessage = 'Google sign-in successful.');
    } catch (e) {
      setState(() => statusMessage = 'Google sign-in failed: $e');
    }
  }

  Future<void> _sendPhoneCode() async {
    try {
      await auth.verifyPhoneNumber(
        phoneNumber: phoneController.text.trim(),
        verificationCompleted: (phoneAuthCredential) async {
          await auth.signInWithCredential(phoneAuthCredential);
          setState(() => statusMessage = 'Phone auto verified and signed in.');
        },
        verificationFailed: (exception) {
          setState(() => statusMessage = 'Phone verification failed: ${exception.message}');
        },
        codeSent: (verificationId, resendToken) {
          setState(() {
            this.verificationId = verificationId;
            statusMessage = 'Verification code sent.';
          });
        },
        codeAutoRetrievalTimeout: (verificationId) {
          setState(() => this.verificationId = verificationId);
        },
      );
    } catch (e) {
      setState(() => statusMessage = 'Phone code send failed: $e');
    }
  }

  Future<void> _verifyPhoneCode() async {
    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: verificationId,
        smsCode: codeController.text.trim(),
      );
      await auth.signInWithCredential(credential);
      setState(() => statusMessage = 'Phone sign-in successful.');
    } catch (e) {
      setState(() => statusMessage = 'Phone verification failed: $e');
    }
  }

  Future<void> _saveProfile() async {
    if (currentUser == null) return;
    await firestore.collection('users').doc(currentUser!.uid).set({
      'displayName': displayNameController.text.trim(),
      'role': roleController.text.trim(),
      'company': companyController.text.trim(),
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
    setState(() => statusMessage = 'Profile saved.');
  }

  Future<void> _deleteProfile() async {
    if (currentUser == null) return;
    await firestore.collection('users').doc(currentUser!.uid).delete();
    displayNameController.clear();
    roleController.clear();
    companyController.clear();
    setState(() => statusMessage = 'Profile deleted.');
  }

  Future<void> _saveRealtimeMessage() async {
    if (currentUser == null) return;
    final ref = realtimeDatabase.ref('users/${currentUser!.uid}/realtimeMessage');
    await ref.set(realtimeMessageController.text.trim());
    setState(() => statusMessage = 'Realtime message saved.');
  }

  Future<void> _deleteRealtimeMessage() async {
    if (currentUser == null) return;
    final ref = realtimeDatabase.ref('users/${currentUser!.uid}/realtimeMessage');
    await ref.remove();
    setState(() => statusMessage = 'Realtime message deleted.');
  }

  Future<void> _signOut() async {
    await auth.signOut();
    displayNameController.clear();
    roleController.clear();
    companyController.clear();
    phoneController.clear();
    codeController.clear();
    setState(() {
      statusMessage = 'Signed out.';
      liveMessage = 'No message stored yet.';
      verificationId = '';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Firebase Starter')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(statusMessage, style: const TextStyle(color: Colors.greenAccent)),
            const SizedBox(height: 16),
            if (currentUser == null) ...[
              _buildEmailPasswordSection(),
              const SizedBox(height: 16),
              _buildGoogleButton(),
              const SizedBox(height: 16),
              _buildPhoneSection(),
            ] else ...[
              Text('Signed in as: ${currentUser!.email ?? currentUser!.phoneNumber}', style: const TextStyle(fontSize: 16)),
              const SizedBox(height: 16),
              _buildProfileSection(),
              const SizedBox(height: 16),
              _buildRealtimeSection(),
              const SizedBox(height: 24),
              ElevatedButton(onPressed: _signOut, child: const Text('Sign Out')),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmailPasswordSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text('Email / Password Auth', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(controller: emailController, decoration: const InputDecoration(labelText: 'Email')),
            const SizedBox(height: 12),
            TextField(controller: passwordController, decoration: const InputDecoration(labelText: 'Password'), obscureText: true),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _signUpWithEmail, child: const Text('Sign Up')),
            const SizedBox(height: 8),
            ElevatedButton(onPressed: _signInWithEmail, child: const Text('Sign In')),
          ],
        ),
      ),
    );
  }

  Widget _buildGoogleButton() {
    return ElevatedButton.icon(
      onPressed: _signInWithGoogle,
      icon: const Icon(Icons.login),
      label: const Text('Sign in with Google'),
    );
  }

  Widget _buildPhoneSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text('Phone Authentication', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(controller: phoneController, decoration: const InputDecoration(labelText: 'Phone number', hintText: '+1234567890')),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _sendPhoneCode, child: const Text('Send Verification Code')),
            const SizedBox(height: 12),
            TextField(controller: codeController, decoration: const InputDecoration(labelText: 'SMS Code')),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _verifyPhoneCode, child: const Text('Verify Code')),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text('Firestore Profile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(controller: displayNameController, decoration: const InputDecoration(labelText: 'Display Name')),
            const SizedBox(height: 12),
            TextField(controller: roleController, decoration: const InputDecoration(labelText: 'Role')),
            const SizedBox(height: 12),
            TextField(controller: companyController, decoration: const InputDecoration(labelText: 'Company')),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _saveProfile, child: const Text('Save Profile')),
            const SizedBox(height: 8),
            ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: Colors.red), onPressed: _deleteProfile, child: const Text('Delete Profile')),
          ],
        ),
      ),
    );
  }

  Widget _buildRealtimeSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text('Realtime Database', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(controller: realtimeMessageController, decoration: const InputDecoration(labelText: 'Message')),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _saveRealtimeMessage, child: const Text('Save Realtime Data')),
            const SizedBox(height: 8),
            ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: Colors.red), onPressed: _deleteRealtimeMessage, child: const Text('Delete Realtime Message')),
            const SizedBox(height: 12),
            Text('Live stored value:', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text(liveMessage),
          ],
        ),
      ),
    );
  }
}
