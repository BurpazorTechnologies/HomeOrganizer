<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forwarded Contact Mail</title>
    <style>
        body { font-family: Arial, sans-serif; color: #222; }
        .label { font-weight: bold; }
        .container { background: #f9f9f9; padding: 24px; border-radius: 8px; }
        .section { margin-bottom: 16px; }
        .message { white-space: pre-line; background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <h2>New Contact Form Submission</h2>
        <div class="section">
            <span class="label">From:</span> {{ $mail->sender_name }} &lt;{{ $mail->sender_email }}&gt;
        </div>
        <div class="section">
            <span class="label">Subject:</span> {{ $mail->subject }}
        </div>
        <div class="section">
            <span class="label">Message:</span>
            <div class="message">{{ $mail->message }}</div>
        </div>
        @if(!empty($mail->additional_details))
            <div class="section">
                <span class="label">Additional Details:</span>
                <pre>{{ json_encode($mail->additional_details, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</pre>
            </div>
        @endif
        <div class="section" style="font-size: 0.9em; color: #888;">
            <em>Forwarded automatically by {{ config('app.name') }}.</em>
        </div>
    </div>
</body>
</html>
