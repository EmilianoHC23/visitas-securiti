<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure JWT secret is set for tests
        if (! config('jwt.secret')) {
            config(['jwt.secret' => env('JWT_SECRET', 'testing-secret')]);
            putenv('JWT_SECRET=testing-secret');
        }

        // Force in-memory sqlite for faster tests if not configured
        if (env('DB_CONNECTION') !== 'sqlite') {
            config(['database.default' => 'sqlite']);
            config(['database.connections.sqlite.database' => ':memory:']);
        }
    }
}
