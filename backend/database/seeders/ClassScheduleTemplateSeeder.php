<?php

namespace Database\Seeders;

use App\Models\ClassScheduleTemplate;
use Illuminate\Database\Seeder;

class ClassScheduleTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            ['name' => 'Mon-Tue · Morning', 'days' => [1, 2], 'starts_at' => '08:00', 'ends_at' => '09:30'],
            ['name' => 'Mon-Thu · Morning', 'days' => [1, 2, 3, 4], 'starts_at' => '08:00', 'ends_at' => '09:30'],
            ['name' => 'Mon-Fri · Morning', 'days' => [1, 2, 3, 4, 5], 'starts_at' => '08:00', 'ends_at' => '09:30'],
            ['name' => 'Sat-Sun · Morning', 'days' => [6, 7], 'starts_at' => '08:00', 'ends_at' => '09:30'],
        ];

        foreach ($templates as $template) {
            ClassScheduleTemplate::firstOrCreate(
                ['name' => $template['name']],
                [...$template, 'status' => 'active'],
            );
        }
    }
}
