@php
    $firstName = $firstName ?? 'there';
@endphp

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reset your HomeOrganizer password</title>
    <style>
        body {
            width: 100%;
            margin: 0;
            padding: 24px;
            box-sizing: border-box;
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background-color: #f4f6fb;
            color: #0f172a;
        }

        .card {
            max-width: 560px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            padding: 40px 48px;
            box-shadow: 0 12px 45px rgba(15, 23, 42, 0.08);
        }

        .title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 12px;
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
    <div class="title">Password reset requested</div>
    <p class="text">Hi {{ $firstName }},</p>
    <p class="text">
        You recently asked to reset the password for your HomeOrganizer account. Click the button below to choose a new one.
        This link will stay active for 60 minutes.
    </p>

    <p style="text-align: center;">
        <a href="{{ $resetUrl }}" class="cta">Reset password</a>
    </p>

    <p class="text" style="font-size: 13px;">
        If the button doesn’t work, copy and paste this link into your browser:<br>
        <a href="{{ $resetUrl }}" style="color: #2563eb;">{{ $resetUrl }}</a>
    </p>

    <p class="footer">
        If you didn’t request a reset, you can safely ignore this email—your password hasn’t changed.
    </p>
</div>
</body>
</html>

