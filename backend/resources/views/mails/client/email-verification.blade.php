@php
    $firstName = $firstName ?? 'there';
@endphp

<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #0F172A; margin-bottom: 16px;">Verify your email address</h2>

    <p style="color: #334155; line-height: 1.5;">
        Hi {{ $firstName }},
    </p>

    <p style="color: #334155; line-height: 1.5;">
        Thanks for signing up! Please confirm your email address by clicking the button below. This step helps us keep your account secure.
    </p>

    <p style="text-align: center; margin: 32px 0;">
        <a href="{{ $verificationLink }}"
           style="display: inline-block; padding: 12px 24px; background: #2563EB; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Verify Email
        </a>
    </p>

    <p style="color: #64748B; font-size: 14px; line-height: 1.4;">
        If you’re having trouble clicking the button, copy and paste this URL into your browser:
        <br>
        <a href="{{ $verificationLink }}" style="color: #2563EB; word-break: break-all;">{{ $verificationLink }}</a>
    </p>

    <p style="color: #94A3B8; font-size: 12px; margin-top: 32px;">
        If you didn’t create an account, no further action is required.
    </p>
</div>

