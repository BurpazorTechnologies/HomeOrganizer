import 'dart:math';

class RequestId {
  RequestId._();

  static final Random _rng = Random.secure();

  static String newId() {
    final now = DateTime.now().microsecondsSinceEpoch;
    final rand = _rng.nextInt(1 << 32).toRadixString(16).padLeft(8, '0');
    return '$now-$rand';
  }
}
