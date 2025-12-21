class EmailValidator {
  EmailValidator._();

  static bool isValid(String value) {
    final v = value.trim();
    if (v.isEmpty) return false;
    // Minimal sanity check; avoid over-complicated email regex.
    return v.contains('@') && v.contains('.');
  }
}
