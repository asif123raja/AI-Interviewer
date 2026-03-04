import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'api_service.dart'; // To reuse the baseUrl

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Stream of auth state changes
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Get current user
  User? get currentUser => _auth.currentUser;

  // Register with email and password
  Future<UserCredential> registerWithEmail(String email, String password, String displayName) async {
    try {
      UserCredential userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // Update display name
      await userCredential.user?.updateDisplayName(displayName);

      // Sync with backend (mirroring the SocialAuth logic or /api/users webhook if needed)
      // Call sync explicitly if your backend requires it right away
      await syncUserWithBackend(userCredential.user);
      
      return userCredential;
    } catch (e) {
      rethrow;
    }
  }

  // Login with email and password
  Future<UserCredential> loginWithEmail(String email, String password) async {
    try {
      UserCredential userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      return userCredential;
    } catch (e) {
      rethrow;
    }
  }

  // Future Google Auth login could be added here
  // using google_sign_in package

  // Logout
  Future<void> logout() async {
    await _auth.signOut();
  }

  // Example backend sync logic (matching the NextJS web app logic)
  Future<void> syncUserWithBackend(User? user) async {
    if (user == null) return;
    try {
      final token = await user.getIdToken();
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/api/users/sync'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'uid': user.uid,
          'email': user.email,
          'displayName': user.displayName,
          'photoURL': user.photoURL,
        }),
      );
      if (response.statusCode >= 400) {
        print('Backend sync failed: ${response.body}');
      }
    } catch (e) {
      print('Error syncing user: $e');
    }
  }
}
