<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::post('login', [AuthController::class, 'login']);
// Aliases to match frontend expectations
Route::post('auth/login', [AuthController::class, 'login']);

// Public token endpoints (invitation accept, approval decision)
Route::post('invitations/{token}/accept', [App\Http\Controllers\InvitationController::class, 'accept']);
// Frontend-friendly invitation endpoints
Route::get('invitations/verify/{token}', [App\Http\Controllers\InvitationController::class, 'verify']);
Route::post('invitations/complete', [App\Http\Controllers\InvitationController::class, 'complete']);
// Public visit registration expected by frontend
Route::post('public/visit', [App\Http\Controllers\VisitController::class, 'storePublic']);
Route::post('approvals/{token}/decision', [App\Http\Controllers\ApprovalController::class, 'decision']);

Route::middleware(['auth:api'])->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::post('auth/refresh', [AuthController::class, 'refresh']);
    Route::get('me', [AuthController::class, 'me']);
    Route::get('auth/me', [AuthController::class, 'me']);

    // CRUD de usuarios
    Route::get('users', [App\Http\Controllers\UserController::class, 'index']);
    Route::get('users/{id}', [App\Http\Controllers\UserController::class, 'show']);

    // Rutas protegidas: solo admin puede crear/actualizar/eliminar usuarios
    Route::middleware(['role:admin'])->group(function () {
        Route::post('users', [App\Http\Controllers\UserController::class, 'store']);
        Route::put('users/{id}', [App\Http\Controllers\UserController::class, 'update']);
        Route::delete('users/{id}', [App\Http\Controllers\UserController::class, 'destroy']);
    });
    // CRUD de accesos
    Route::get('accesses', [App\Http\Controllers\AccessController::class, 'index']);
    Route::get('accesses/{id}', [App\Http\Controllers\AccessController::class, 'show']);

    // Rutas protegidas: solo admin puede crear/actualizar/eliminar accesos
    Route::middleware(['role:admin'])->group(function () {
        Route::post('accesses', [App\Http\Controllers\AccessController::class, 'store']);
        Route::put('accesses/{id}', [App\Http\Controllers\AccessController::class, 'update']);
        Route::delete('accesses/{id}', [App\Http\Controllers\AccessController::class, 'destroy']);
    });

    // Singular aliases expected by frontend: /access
    Route::get('access', [App\Http\Controllers\AccessController::class, 'index']);
    Route::get('access/{id}', [App\Http\Controllers\AccessController::class, 'show']);
    Route::post('access', [App\Http\Controllers\AccessController::class, 'store']);
    Route::put('access/{id}', [App\Http\Controllers\AccessController::class, 'update']);
    Route::delete('access/{id}', [App\Http\Controllers\AccessController::class, 'destroy']);

    // CRUD de visitas
    Route::get('visits', [App\Http\Controllers\VisitController::class, 'index']);
    Route::post('visits', [App\Http\Controllers\VisitController::class, 'store']);
    // Frontend expects a public/self-register route
    Route::post('visits/register', [App\Http\Controllers\VisitController::class, 'store']);
    Route::get('visits/{visit}', [App\Http\Controllers\VisitController::class, 'show']);
    Route::put('visits/{visit}', [App\Http\Controllers\VisitController::class, 'update']);
    // Frontend expects an explicit status path
    Route::put('visits/{visit}/status', [App\Http\Controllers\VisitController::class, 'update']);
    Route::delete('visits/{visit}', [App\Http\Controllers\VisitController::class, 'destroy']);

    // Visit actions (primary)
    Route::post('visits/{visit}/checkin', [App\Http\Controllers\VisitController::class, 'checkin']);
    Route::post('visits/{visit}/checkout', [App\Http\Controllers\VisitController::class, 'checkout']);
    Route::post('visits/{visit}/cancel', [App\Http\Controllers\VisitController::class, 'cancel']);
    // Frontend-friendly action routes (id-based)
    Route::post('visits/checkin/{id}', function ($id) {
        $visit = \App\Models\Visit::findOrFail($id);
        $controller = app()->make(App\Http\Controllers\VisitController::class);
        return $controller->checkin($visit);
    });
    Route::post('visits/checkout/{id}', function ($id) {
        $visit = \App\Models\Visit::findOrFail($id);
        $controller = app()->make(App\Http\Controllers\VisitController::class);
        return $controller->checkout($visit);
    });
    Route::post('visits/cancel/{id}', function ($id) {
        $visit = \App\Models\Visit::findOrFail($id);
        $controller = app()->make(App\Http\Controllers\VisitController::class);
        return $controller->cancel($visit);
    });
    // QR scan endpoint expected by frontend
    Route::post('visits/scan-qr', [App\Http\Controllers\VisitController::class, 'scanQr']);

    // Nested visit events
    Route::get('visits/{visit}/events', [App\Http\Controllers\VisitEventController::class, 'index']);
    Route::post('visits/{visit}/events', [App\Http\Controllers\VisitEventController::class, 'store']);

    // Agenda / public-like convenience endpoints used by frontend
    Route::get('visits/agenda', [App\Http\Controllers\VisitController::class, 'index']);

    // CRUD de empresas
    Route::get('companies', [App\Http\Controllers\CompanyController::class, 'index']);
    Route::get('companies/{id}', [App\Http\Controllers\CompanyController::class, 'show']);
    // Company convenience endpoints
    Route::get('company/config', [App\Http\Controllers\CompanyController::class, 'show']);
    Route::get('company/qr-code', [App\Http\Controllers\CompanyController::class, 'qrCode']);

    // Rutas protegidas: solo admin puede crear/actualizar/eliminar empresas
    Route::middleware(['role:admin'])->group(function () {
        Route::post('companies', [App\Http\Controllers\CompanyController::class, 'store']);
        Route::put('companies/{id}', [App\Http\Controllers\CompanyController::class, 'update']);
        Route::delete('companies/{id}', [App\Http\Controllers\CompanyController::class, 'destroy']);
    });

    // Reportes y métricas (admin + reception can view)
    Route::middleware(['role:admin,reception'])->group(function () {
        Route::get('reports/visits-by-date', [App\Http\Controllers\ReportController::class, 'visitsByDate']);
        Route::get('reports/visits-by-company', [App\Http\Controllers\ReportController::class, 'visitsByCompany']);
        Route::get('reports/visits-by-status', [App\Http\Controllers\ReportController::class, 'visitsByStatus']);
    });

    // Invitations (protected CRUD)
    Route::get('invitations', [App\Http\Controllers\InvitationController::class, 'index']);
    Route::post('invitations', [App\Http\Controllers\InvitationController::class, 'store']);
    Route::get('invitations/{invitation}', [App\Http\Controllers\InvitationController::class, 'show']);
    Route::delete('invitations/{invitation}', [App\Http\Controllers\InvitationController::class, 'destroy']);
    // Invitation utilities expected by frontend
    Route::post('invitations/resend/{userId}', [App\Http\Controllers\InvitationController::class, 'resend']);
    Route::get('invitations/test-smtp', [App\Http\Controllers\InvitationController::class, 'testSmtp']);

    // BLACKLIST MANAGEMENT (frontend expects /blacklist)
    if (class_exists(\App\Http\Controllers\BlacklistController::class)) {
        Route::get('blacklist', [App\Http\Controllers\BlacklistController::class, 'index']);
        Route::post('blacklist', [App\Http\Controllers\BlacklistController::class, 'store']);
        Route::delete('blacklist/{id}', [App\Http\Controllers\BlacklistController::class, 'destroy']);
    } else {
        Route::get('blacklist', function () { return response()->json(['message' => 'Not implemented'], 404); });
        Route::post('blacklist', function () { return response()->json(['message' => 'Not implemented'], 404); });
        Route::delete('blacklist/{id}', function () { return response()->json(['message' => 'Not implemented'], 404); });
    }

    // Approvals (protected listing)
    Route::get('approvals', [App\Http\Controllers\ApprovalController::class, 'index']);
    Route::get('approvals/{approval}', [App\Http\Controllers\ApprovalController::class, 'show']);
});
