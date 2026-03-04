import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Tailwind Zinc & Indigo colors mappings
  static const Color backgroundLight = Color(0xFFFFFFFF);
  static const Color backgroundDark = Color(0xFF09090B); // zinc-950
  
  static const Color foregroundLight = Color(0xFF09090B);
  static const Color foregroundDark = Color(0xFFFAFAFA);

  static const Color primary = Color(0xFF4F46E5); // indigo-600
  static const Color primaryDark = Color(0xFF6366F1); // indigo-500

  static const Color borderLight = Color(0xFFE4E4E7); // zinc-200
  static const Color borderDark = Color(0xFF27272A); // zinc-800

  static const Color mutedLight = Color(0xFFF4F4F5); // zinc-100
  static const Color mutedDark = Color(0xFF27272A);

  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color cardDark = Color(0xFF18181B); // zinc-900

  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      primaryColor: primary,
      scaffoldBackgroundColor: backgroundLight,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: primary,
        surface: cardLight,
        background: backgroundLight,
        onSurface: foregroundLight,
        onBackground: foregroundLight,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme).apply(
        bodyColor: foregroundLight,
        displayColor: foregroundLight,
      ),
      dividerColor: borderLight,
      appBarTheme: const AppBarTheme(
        backgroundColor: backgroundLight,
        foregroundColor: foregroundLight,
        elevation: 0,
      ),
      elevatedButtonTheme: _elevatedButtonTheme(primary, Colors.white),
      outlinedButtonTheme: _outlinedButtonTheme(primary, foregroundLight, borderLight),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: primaryDark,
      scaffoldBackgroundColor: backgroundDark,
      colorScheme: const ColorScheme.dark(
        primary: primaryDark,
        secondary: primaryDark,
        surface: cardDark,
        background: backgroundDark,
        onSurface: foregroundDark,
        onBackground: foregroundDark,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).apply(
        bodyColor: foregroundDark,
        displayColor: foregroundDark,
      ),
      dividerColor: borderDark,
      appBarTheme: const AppBarTheme(
        backgroundColor: backgroundDark,
        foregroundColor: foregroundDark,
        elevation: 0,
      ),
      elevatedButtonTheme: _elevatedButtonTheme(primaryDark, Colors.white),
      outlinedButtonTheme: _outlinedButtonTheme(primaryDark, foregroundDark, borderDark),
    );
  }

  static ElevatedButtonThemeData _elevatedButtonTheme(Color bg, Color fg) {
    return ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: bg,
        foregroundColor: fg,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
      ),
    );
  }

  static OutlinedButtonThemeData _outlinedButtonTheme(Color primary, Color fg, Color border) {
    return OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: fg,
        side: BorderSide(color: border),
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
      ),
    );
  }
}
