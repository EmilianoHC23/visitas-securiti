<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;

trait CreatesApplication
{
    /**
     * Creates the application.
     *
     * @return \Illuminate\Foundation\Application
     */
    public function createApplication()
    {
        // Ensure test environment variables are set before booting the app
        putenv('JWT_SECRET=testing-secret');
        $_ENV['JWT_SECRET'] = 'testing-secret';
        $_SERVER['JWT_SECRET'] = 'testing-secret';

        // Force sqlite in-memory for tests unless explicitly set
        if (! getenv('DB_CONNECTION')) {
            putenv('DB_CONNECTION=sqlite');
            putenv('DB_DATABASE=:memory:');
            $_ENV['DB_CONNECTION'] = 'sqlite';
            $_ENV['DB_DATABASE'] = ':memory:';
            $_SERVER['DB_CONNECTION'] = 'sqlite';
            $_SERVER['DB_DATABASE'] = ':memory:';
        }

        $app = require __DIR__ . '/../bootstrap/app.php';
        $app->make(Kernel::class)->bootstrap();

        return $app;
    }
}
