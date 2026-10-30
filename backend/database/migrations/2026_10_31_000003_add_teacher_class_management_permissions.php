<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        foreach ([
            'add_students',
            'switch_teacher',
            'edit',
            'schedule_end',
            'pre_end',
            'resume',
        ] as $feature) {
            DB::table('role_feature_permissions')->updateOrInsert(
                ['role' => 'teacher', 'module' => 'classes', 'feature' => $feature],
                ['allowed' => true, 'created_at' => now(), 'updated_at' => now()],
            );
        }
    }

    public function down(): void
    {
        DB::table('role_feature_permissions')
            ->where('role', 'teacher')
            ->where('module', 'classes')
            ->whereIn('feature', ['add_students', 'switch_teacher', 'edit', 'schedule_end', 'pre_end', 'resume'])
            ->delete();
    }
};
