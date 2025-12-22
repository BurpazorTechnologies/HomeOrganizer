<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Your Interest</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #2d3436;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 30px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #00b894;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #00b894;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            color: #2d3436;
            font-size: 16px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 14px;
            color: #636e72;
        }
        .signature {
            margin-top: 20px;
            color: #4b6584;
            font-weight: 500;
        }
        .highlight {
            color: #00b894;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thank You for Reaching Out</h1>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            
            <p>Thank you for your interest in discussing a project or opportunity with me. I've received your message and will review it carefully.</p>
            
            <p>I typically respond to all inquiries within <span class="highlight">24-48 hours</span>. In the meantime, you can learn more about my work and experience through my portfolio website.</p>
            
            <p>If you have any urgent matters, please don't hesitate to reach out again.</p>
            
            <div class="signature">
                <p>Best regards,<br>
                Winzor Joseph Paelmo</p>
            </div>
        </div>
        
        <div class="footer">
            <p><em>This is an automated response from {{ config('app.name') }}. Please do not reply to this email.</em></p>
        </div>
    </div>
</body>
</html>
