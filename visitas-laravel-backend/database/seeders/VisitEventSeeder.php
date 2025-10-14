<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\VisitEvent;
use App\Models\Visit;

class VisitEventSeeder extends Seeder
{
    public function run(): void
    {
        $visit = Visit::first();
        VisitEvent::create([
            'visit_id' => $visit->id,
            'type' => 'check-in',
            'photos' => json_encode([]),
            'timestamp' => now(),
        ]);
    }
}
