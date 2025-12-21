import 'package:flutter/material.dart';
import 'package:home_organizer_flutter_app/l10n/gen/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:home_organizer_flutter_app/app/theme/app_tokens.dart';
import 'package:home_organizer_flutter_app/features/auth/presentation/login_controller.dart';
import 'package:home_organizer_flutter_app/features/version/version.dart';
import 'package:home_organizer_flutter_app/shared/errors/failure.dart';
import 'package:home_organizer_flutter_app/shared/validators/email_validator.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  bool _obscurePassword = true;

  void _onLoginPressed() {
    final l10n = AppLocalizations.of(context);
    if (l10n == null) return;

    final isValid = _formKey.currentState?.validate() ?? false;
    if (!isValid) return;

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    ref
        .read(loginControllerProvider.notifier)
        .login(email: email, password: password);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String? _loginErrorText(AppLocalizations l10n, Object error) {
    if (error is Failure) {
      return error.when(
        network: (message, statusCode) {
          if (statusCode == 429) return l10n.authLoginTooManyAttempts;
          return l10n.authLoginFailedGeneric;
        },
        auth: (_) => l10n.authLoginInvalidCredentials,
        validation: (_) => l10n.authLoginInvalidCredentials,
        unexpected: (_) => l10n.authLoginFailedGeneric,
      );
    }
    return l10n.authLoginFailedGeneric;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    if (l10n == null) {
      return const SizedBox.shrink();
    }

    final tokens = context.tokens;
    final loginState = ref.watch(loginControllerProvider);
    final loginLoading = loginState.isLoading;
    final loginError = loginState.whenOrNull(
      error: (error, _) => _loginErrorText(l10n, error),
    );

    final backendVersion = ref.watch(backendVersionProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.authLoginTitle)),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(tokens.spacingM),
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
                        l10n.appTitle,
                        style: Theme.of(context).textTheme.headlineMedium,
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: tokens.spacingL),
                      TextFormField(
                        controller: _emailController,
                        decoration: InputDecoration(
                          labelText: l10n.authEmailLabel,
                        ),
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.email],
                        validator: (value) {
                          final v = (value ?? '');
                          if (v.trim().isEmpty) {
                            return l10n.authEmailRequired;
                          }
                          if (!EmailValidator.isValid(v)) {
                            return l10n.authEmailInvalid;
                          }
                          return null;
                        },
                      ),
                      SizedBox(height: tokens.spacingS + 4),
                      TextFormField(
                        controller: _passwordController,
                        decoration: InputDecoration(
                          labelText: l10n.authPasswordLabel,
                          suffixIcon: IconButton(
                            tooltip: _obscurePassword
                                ? l10n.authPasswordVisibilityShow
                                : l10n.authPasswordVisibilityHide,
                            onPressed: () => setState(() {
                              _obscurePassword = !_obscurePassword;
                            }),
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
                            return l10n.authPasswordRequired;
                          }
                          return null;
                        },
                      ),
                      SizedBox(height: tokens.spacingM + 4),
                      if (loginError != null) ...[
                        Text(
                          loginError,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                            fontWeight: FontWeight.w600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: tokens.spacingS + 4),
                      ],
                      ElevatedButton(
                        onPressed: loginLoading ? null : _onLoginPressed,
                        child: loginLoading
                            ? const SizedBox(
                                height: 18,
                                width: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(l10n.authLoginButton),
                      ),
                      SizedBox(height: tokens.spacingM),
                      _BackendVersionText(value: backendVersion),
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

class _BackendVersionText extends StatelessWidget {
  const _BackendVersionText({required this.value});

  final AsyncValue<String> value;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    if (l10n == null) return const SizedBox.shrink();

    final style = Theme.of(context).textTheme.bodySmall?.copyWith(
      color: Theme.of(context).colorScheme.onSurfaceVariant,
    );

    final text = value.when(
      data: (v) => l10n.versionValue(v),
      loading: () => l10n.versionLoading,
      error: (error, stackTrace) => l10n.versionUnavailable,
    );

    return Text(text, style: style, textAlign: TextAlign.center);
  }
}
