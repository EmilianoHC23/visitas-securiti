<html>
<body>
    <p>Hola {{ $invitation->first_name ?? '' }},</p>
    <p>Has sido invitado a unirte a {{ $invitation->company->name ?? 'nuestra plataforma' }}.</p>
    <p>Para aceptar, haz click en el siguiente enlace:</p>
    <p><a href="{{ url('/api/invitations/'.$invitation->invitation_token.'/accept') }}">Aceptar invitación</a></p>
    <p>El enlace expira el {{ $invitation->expires_at }}</p>
</body>
</html>