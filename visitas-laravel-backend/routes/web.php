<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Swagger UI to view OpenAPI spec
Route::get('/docs', function () {
    return view('swagger');
});
