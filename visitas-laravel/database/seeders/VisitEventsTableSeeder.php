<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\VisitEvent;
use App\Models\Visit;

class VisitEventsTableSeeder extends Seeder
{
    public function run()
    {
        $json = file_get_contents(database_path('seeders/data/visitevents.json'));
        $lines = explode("\n", trim($json));
        $data = array_map(fn($line) => json_decode($line, true), $lines);

        // Mapa de mongo_id de visits a id real
        $visitMap = Visit::pluck('id', 'mongo_id')->toArray();

        foreach ($data as $item) {
            $visitMongoId = $item['visitId']['$oid'];
            $visit_id = $visitMap[$visitMongoId] ?? null;
            if (!$visit_id) continue;
            VisitEvent::create([
                'visit_id' => $visit_id,
                'type' => $item['type'],
                'photos' => $item['photos'] ?? [],
                'timestamp' => isset($item['timestamp']['$date']) ? date('Y-m-d H:i:s', strtotime($item['timestamp']['$date'])) : null,
            ]);
        }
    }
}
