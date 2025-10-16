<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::post('login', [AuthController::class, 'login']);

Route::middleware(['auth:api'])->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('me', [AuthController::class, 'me']);

    // CRUD de usuarios
    Route::get('users', [App\Http\Controllers\UserController::class, 'index']);
    Route::post('users', [App\Http\Controllers\UserController::class, 'store']);
    Route::get('users/{id}', [App\Http\Controllers\UserController::class, 'show']);
    Route::put('users/{id}', [App\Http\Controllers\UserController::class, 'update']);
    Route::delete('users/{id}', [App\Http\Controllers\UserController::class, 'destroy']);
    // CRUD de accesos
    Route::get('accesses', [App\Http\Controllers\AccessController::class, 'index']);
    Route::post('accesses', [App\Http\Controllers\AccessController::class, 'store']);
    Route::get('accesses/{id}', [App\Http\Controllers\AccessController::class, 'show']);
    Route::put('accesses/{id}', [App\Http\Controllers\AccessController::class, 'update']);
    Route::delete('accesses/{id}', [App\Http\Controllers\AccessController::class, 'destroy']);

    // CRUD de visitas
    Route::get('visits', [App\Http\Controllers\VisitController::class, 'index']);
    Route::post('visits', [App\Http\Controllers\VisitController::class, 'store']);
    Route::get('visits/{id}', [App\Http\Controllers\VisitController::class, 'show']);
    Route::put('visits/{id}', [App\Http\Controllers\VisitController::class, 'update']);
    Route::delete('visits/{id}', [App\Http\Controllers\VisitController::class, 'destroy']);
});
