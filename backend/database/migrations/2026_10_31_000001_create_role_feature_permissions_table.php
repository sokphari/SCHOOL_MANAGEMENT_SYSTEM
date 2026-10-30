<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_feature_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('role', 30);
            $table->string('module', 60);
            $table->string('feature', 60);
            $table->boolean('allowed')->default(false);
            $table->timestamps();
            $table->unique(['role', 'module', 'feature']);
        });

        $now = now();
        $permissions = [];
        foreach (config('role_permissions.teacher_modules') as $module => $definition) {
            foreach ($definition['features'] as $feature => $_label) {
                $permissions[] = [
                    'role' => 'teacher',
                    'module' => $module,
                    'feature' => $feature,
                    'allowed' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('role_feature_permissions')->insert($permissions);
    }

    public function down(): void
    {
        Schema::dropIfExists('role_feature_permissions');
    }
};
