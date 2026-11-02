<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_schedule_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->json('days');
            $table->time('starts_at');
            $table->time('ends_at');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_schedule_templates');
    }
};
