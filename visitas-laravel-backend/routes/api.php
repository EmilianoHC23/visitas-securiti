<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::post('login', [AuthController::class, 'login']);

// Public token endpoints (invitation accept, approval decision)
Route::post('invitations/{token}/accept', [App\Http\Controllers\InvitationController::class, 'accept']);
Route::post('approvals/{token}/decision', [App\Http\Controllers\ApprovalController::class, 'decision']);

Route::middleware(['auth:api'])->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('me', [AuthController::class, 'me']);

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

    // CRUD de visitas
    Route::get('visits', [App\Http\Controllers\VisitController::class, 'index']);
    Route::post('visits', [App\Http\Controllers\VisitController::class, 'store']);
    Route::get('visits/{id}', [App\Http\Controllers\VisitController::class, 'show']);
    Route::put('visits/{id}', [App\Http\Controllers\VisitController::class, 'update']);
    Route::delete('visits/{id}', [App\Http\Controllers\VisitController::class, 'destroy']);

    // CRUD de empresas
    Route::get('companies', [App\Http\Controllers\CompanyController::class, 'index']);
    Route::get('companies/{id}', [App\Http\Controllers\CompanyController::class, 'show']);

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

    // Approvals (protected listing)
    Route::get('approvals', [App\Http\Controllers\ApprovalController::class, 'index']);
    Route::get('approvals/{approval}', [App\Http\Controllers\ApprovalController::class, 'show']);
});
