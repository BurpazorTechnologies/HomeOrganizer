@php
    $fullName = $fullName ?? 'there';
@endphp

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Your HomeOrganizer temporary password</title>
    <style>
        body {
            width: 100%;
            margin: 0;
            padding: 24px;
            box-sizing: border-box;
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background-color: #eef4ff;
            color: #0f172a;
        }

        .card {
            max-width: 560px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            padding: 40px 48px;
            box-shadow: 0 18px 55px rgba(37, 99, 235, 0.15);
        }

        .title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 12px;
        }

        .pill {
            display: inline-block;
            margin: 20px 0;
            padding: 14px 32px;
            border-radius: 14px;
            background: #0f172a;
            color: #ffffff;
            font-size: 22px;
            letter-spacing: 1px;
        }

        .text {
            font-size: 15px;
            line-height: 1.6;
            color: #475569;
            margin: 0 0 16px;
        }

        .cta {
            display: inline-block;
            padding: 12px 32px;
            margin: 28px 0 16px;
            border-radius: 999px;
            background-color: #2563eb;
            color: #ffffff !important;
            font-weight: 600;
            text-decoration: none;
        }

        .footer {
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.5;
            margin-top: 32px;
        }
    </style>
</head>
<body>
<div class="card">
    <div class="title">Welcome to HomeOrganizer</div>
    <p class="text">Hi {{ $fullName }},</p>
    <p class="text">
        Here’s the temporary password we generated for your account. Use it to sign in, then update your password to
        something memorable so your profile stays secure.
    </p>

    <p style="text-align: center;">
        <span class="pill">{{ $tempPassword ?? '••••••••' }}</span>
    </p>

    @if(!empty($resetUrl))
        <p class="text">
            When you’re ready, tap the button below to set a new password that only you know.
        </p>

        <p style="text-align: center;">
            <a href="{{ $resetUrl }}" class="cta">Create new password</a>
        </p>
    @endif

    <p class="footer">
        Need help? Reply to this email and our team will be in touch.
    </p>
</div>
</body>
</html>

