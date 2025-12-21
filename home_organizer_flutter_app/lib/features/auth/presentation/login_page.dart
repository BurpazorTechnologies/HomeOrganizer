import 'package:flutter/material.dart';
import 'package:home_organizer_flutter_app/app/app_routes.dart';
import 'package:home_organizer_flutter_app/core/logging/app_logger.dart';
import 'package:home_organizer_flutter_app/features/auth/data/auth_service.dart';
import 'package:home_organizer_flutter_app/features/version/data/version_service.dart';
import 'package:home_organizer_flutter_app/services/token_storage.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({
    super.key,
    this.versionService,
    this.authService,
    this.tokenStorage,
  });

  final VersionService? versionService;
  final AuthService? authService;
  final TokenStorage? tokenStorage;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  late final VersionService _versionService;
  late final bool _ownsVersionService;

  late final AuthService _authService;
  late final bool _ownsAuthService;

  late final TokenStorage _tokenStorage;
  late final bool _ownsTokenStorage;

  String? _backendVersion;
  bool _backendVersionLoading = true;

  bool _obscurePassword = true;

  bool _loginLoading = false;
  String? _loginErrorText;

  @override
  void initState() {
    super.initState();
    _ownsVersionService = widget.versionService == null;
    _versionService = widget.versionService ?? VersionService();
    _loadBackendVersion();

    _ownsAuthService = widget.authService == null;
    _authService = widget.authService ?? AuthService();

    _ownsTokenStorage = widget.tokenStorage == null;
    _tokenStorage = widget.tokenStorage ?? TokenStorage();
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
    _login();
  }

  Future<void> _login() async {
    if (_loginLoading) return;

    final isValid = _formKey.currentState?.validate() ?? false;
    if (!isValid) return;

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    setState(() {
      _loginLoading = true;
      _loginErrorText = null;
    });

    try {
      final response = await _authService.login(
        email: email,
        password: password,
      );

      await _tokenStorage.saveToken(response.token);
      if (!mounted) return;

      Navigator.of(context).pushReplacementNamed(AppRoutes.dashboard);
    } on InvalidCredentialsException {
      if (!mounted) return;
      setState(() {
        _loginErrorText = 'Invalid login credentials';
        _loginLoading = false;
      });
    } catch (e, st) {
      AppLogger.error('Login failed', error: e, stackTrace: st);
      if (!mounted) return;
      setState(() {
        _loginErrorText = 'Login failed. Please try again.';
        _loginLoading = false;
      });
    }
  }

  @override
  void dispose() {
    if (_ownsVersionService) {
      _versionService.dispose();
    }
    if (_ownsAuthService) {
      _authService.dispose();
    }
    if (_ownsTokenStorage) {}
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
                  autovalidateMode: AutovalidateMode.onUserInteraction,
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
                        validator: (value) {
                          final v = (value ?? '').trim();
                          if (v.isEmpty) return 'Email is required';
                          if (!v.contains('@')) return 'Enter a valid email';
                          return null;
                        },
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
                        validator: (value) {
                          if ((value ?? '').isEmpty) {
                            return 'Password is required';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 20),
                      if (_loginErrorText != null) ...[
                        Text(
                          _loginErrorText!,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                            fontWeight: FontWeight.w600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                      ],
                      ElevatedButton(
                        onPressed: _loginLoading ? null : _onLoginPressed,
                        child: _loginLoading
                            ? const SizedBox(
                                height: 18,
                                width: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text('Login'),
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


