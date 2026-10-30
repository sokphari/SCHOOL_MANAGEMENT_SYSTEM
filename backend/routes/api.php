<?php

// Keep this file as the API route entry point. Each module owns its endpoints
// in a separate file under routes/api/.
require __DIR__.'/api/auth.php';
require __DIR__.'/api/dashboard.php';
require __DIR__.'/api/students.php';
require __DIR__.'/api/teachers.php';
require __DIR__.'/api/classes.php';
require __DIR__.'/api/locations.php';
require __DIR__.'/api/courses.php';
require __DIR__.'/api/attendances.php';
require __DIR__.'/api/grades.php';
require __DIR__.'/api/timetable.php';
require __DIR__.'/api/student-requests.php';
require __DIR__.'/api/settings.php';
require __DIR__.'/api/utilities.php';
