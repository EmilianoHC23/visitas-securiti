<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Registrar alias de middleware 'role' para uso en rutas
        if (method_exists(Route::class, 'aliasMiddleware')) {
            Route::aliasMiddleware('role', \App\Http\Middleware\CheckRole::class);
        } else {
            // fallback for older Laravel versions: register on router instance
            if (app()->bound('router')) {
                app('router')->aliasMiddleware('role', \App\Http\Middleware\CheckRole::class);
            }
        }
    }
}
