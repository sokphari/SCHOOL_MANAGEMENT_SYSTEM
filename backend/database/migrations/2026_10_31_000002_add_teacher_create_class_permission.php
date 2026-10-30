<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('role_feature_permissions')->updateOrInsert(
            ['role' => 'teacher', 'module' => 'classes', 'feature' => 'create'],
            ['allowed' => true, 'created_at' => now(), 'updated_at' => now()],
        );
    }

    public function down(): void
    {
        DB::table('role_feature_permissions')
            ->where('role', 'teacher')
            ->where('module', 'classes')
            ->where('feature', 'create')
            ->delete();
    }
};
