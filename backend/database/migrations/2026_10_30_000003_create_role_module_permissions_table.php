<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_module_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('role', 30);
            $table->string('module', 60);
            $table->boolean('allowed')->default(false);
            $table->timestamps();
            $table->unique(['role', 'module']);
        });

        $now = now();
        $teacherModules = ['dashboard', 'attendance', 'students', 'classes', 'timetable', 'grades'];
        DB::table('role_module_permissions')->insert(array_map(
            fn (string $module) => [
                'role' => 'teacher',
                'module' => $module,
                'allowed' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            $teacherModules,
        ));
    }

    public function down(): void
    {
        Schema::dropIfExists('role_module_permissions');
    }
};
