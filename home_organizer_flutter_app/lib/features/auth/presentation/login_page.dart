import 'package:flutter/material.dart';
import 'package:home_organizer_flutter_app/core/logging/app_logger.dart';
import 'package:home_organizer_flutter_app/features/version/data/version_service.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({
    super.key,
    this.versionService,
  });

  /// Optional injection for tests / dependency management.
  final VersionService? versionService;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  late final VersionService _versionService;
  late final bool _ownsVersionService;

  String? _backendVersion;
  bool _backendVersionLoading = true;

  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _ownsVersionService = widget.versionService == null;
    _versionService = widget.versionService ?? VersionService();
    _loadBackendVersion();
  }

  Future<void> _loadBackendVersion() async {
    try {
      final version = await _versionService.getVersion();
      if (!mounted) return;
      setState(() {
        _backendVersion = version;
        _backendVersionLoading = false;
      });
    } catch (e) {
      // Keep the UI simple: just show "unavailable".
      AppLogger.warn('Backend version unavailable: $e');
      if (!mounted) return;
      setState(() {
        _backendVersion = null;
        _backendVersionLoading = false;
      });
    }
  }

  void _onLoginPressed() {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    // For now: don't send anything. Just log.
    // Avoid logging raw passwords in real apps.
    AppLogger.info(
      'Login pressed: email=$email passwordLength=${password.length}',
    );
  }

  @override
  void dispose() {
    if (_ownsVersionService) {
      _versionService.dispose();
    }
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Widget _buildBackendVersion(BuildContext context) {
    final style = Theme.of(context).textTheme.bodySmall?.copyWith(
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        );

    final text = _backendVersionLoading
        ? 'Backend version: loading...'
        : _backendVersion == null
            ? 'Backend version: unavailable'
            : 'Backend version: $_backendVersion';

    return Text(
      text,
      style: style,
      textAlign: TextAlign.center,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Login'),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: AutofillGroup(
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Home Organizer',
                        style: Theme.of(context).textTheme.headlineMedium,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      TextFormField(
                        controller: _emailController,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                        ),
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.email],
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _passwordController,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          suffixIcon: IconButton(
                            onPressed: () => setState(
                              () => _obscurePassword = !_obscurePassword,
                            ),
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility
                                  : Icons.visibility_off,
                            ),
                          ),
                        ),
                        obscureText: _obscurePassword,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.password],
                        onFieldSubmitted: (_) => _onLoginPressed(),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: _onLoginPressed,
                        child: const Text('Login'),
                      ),
                      const SizedBox(height: 16),
                      _buildBackendVersion(context),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}


