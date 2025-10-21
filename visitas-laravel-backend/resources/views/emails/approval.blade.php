<html>
<body>
    <p>Hola,</p>
    <p>Tienes una solicitud de aprobación de visita. Revisa el detalle y decide:</p>
    <p><a href="{{ url('/api/approvals/'.$approval->token.'/decision') }}">Tomar decisión</a></p>
    <p>Token: {{ $approval->token }}</p>
    <p>Expira: {{ $approval->expires_at }}</p>
</body>
</html>