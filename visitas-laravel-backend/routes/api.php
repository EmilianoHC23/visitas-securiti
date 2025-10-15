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
});
