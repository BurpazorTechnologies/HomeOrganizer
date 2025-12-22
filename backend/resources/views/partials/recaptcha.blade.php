@if(Route::currentRouteName() === 'index')
<!-- reCAPTCHA -->
<script src="https://www.google.com/recaptcha/enterprise.js?render={{ config('services.recaptcha.contact.site_key') }}"></script>
<script>
    window.contact = window.contact || {};
    window.contact.recaptchaSiteKey = "{{ config('services.recaptcha.contact.site_key') }}";
</script>
@endif