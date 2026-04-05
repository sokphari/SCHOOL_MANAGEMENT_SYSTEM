ឯកសារណែនាំសម្រាប់អភិវឌ្ឍន៍បន្ត
School Management System
Technical Handover + Feature Extension Guide
គោលបំណង៖ ឲ្យអ្នកអភិវឌ្ឍបន្ទាប់ ឬខ្លួនឯងថ្ងៃក្រោយ អាចយល់ project ងាយ និងបន្ថែម feature បានដោយមិនបែក structure។
Backend	Laravel API + Sanctum + Role-based access
Frontend	React + Vite + Axios + React Router + Reusable components
Roles	Admin = full access, Teacher = limited access
Current scope	Students, Teachers, Classes, Attendance, Dashboard, Search/Pagination

 
1. គោលបំណង និងវិសាលភាព
ឯកសារនេះត្រូវបានបង្កើតឡើងសម្រាប់ជាឯកសារប្រគល់ការងារ និងជាគោលការណ៍អភិវឌ្ឍន៍បន្ត។ វាបញ្ជាក់ថា project មានអ្វីខ្លះ និងត្រូវរក្សា architecture បែបណា ពេលបន្ថែម feature ថ្មី។
•	MVP បច្ចុប្បន្នគ្របដណ្តប់លើ module សំខាន់ៗ៖ Students, Teachers, Classes, Attendance, Dashboard, Search/Pagination។
•	Project ត្រូវបានរៀបចំឲ្យ admin គ្រប់គ្រងទិន្នន័យសាលា និង teacher ធ្វើការងារប្រចាំថ្ងៃលើ class របស់ខ្លួន។
2. Business Rules សំខាន់
•	Admin មានសិទ្ធិពេញលើ system ទាំងមូល។
•	Teacher មិនអាច create / edit / delete class ឬ manage teachers បានទេ។
•	Teacher ត្រូវមើលឃើញតែ class របស់ខ្លួន និង mark attendance បានតែ class របស់ខ្លួន។
•	Attendance ត្រូវ save ជា bulk តាម class + date មួយ ដើម្បីសមស្របនឹងការប្រើប្រាស់ពិត។
•	Search និង pagination ត្រូវធ្វើពី backend មុន, frontend គ្រាន់តែផ្ញើ query parameters។
ក្បួនគោល
កុំសរសេរ role restriction តែខាង frontend ប៉ុណ្ណោះ។ Backend ត្រូវ block ផងដែរ។
កុំបន្ថែម feature ថ្មី ដោយមិនពិនិត្យថាវាប៉ះ business rules បច្ចុប្បន្នឬអត់។

3. Architecture Overview
Project នេះប្រើស្ថាបត្យកម្ម frontend-backend ដាច់ដោយឡែក។ Laravel បម្រើជា REST API និង React បម្រើជា admin dashboard/client application។
Layer	Technology	Responsibility
Frontend	React + Vite	UI, routing, forms, role-based menu, API consumption
Backend	Laravel + Sanctum	Authentication, validation, business rules, database access
Database	MySQL	Persistent storage for users, classes, attendance, and relations

4. Database Model (សង្ខេប)
Table	Purpose	Main Fields
users	គណនី login	name, email, password, role
teachers	ព័ត៌មានគ្រូ	user_id, teacher_code, first_name, last_name, ...
students	ព័ត៌មានសិស្ស	student_code, first_name, last_name, gender, ...
school_classes	ថ្នាក់	name, section, academic_year, room, teacher_id
class_student	ភ្ជាប់សិស្សទៅថ្នាក់	school_class_id, student_id, joined_at, status
attendances	វត្តមាន	student_id, school_class_id, attendance_date, status, note, marked_by

5. Project Structure
Backend folders:
•	app/Http/Controllers/Api → API controllers
•	app/Http/Requests → validation request classes
•	app/Models → Eloquent models
•	routes/api.php → API routes
Frontend folders:
•	src/api → Axios and API functions
•	src/components/common → AppInput, AppSelect, AppTable, AppPagination, StatCard
•	src/components/layout → Sidebar, AppLayout
•	src/pages → dashboard, students, teachers, classes, attendance
•	src/context/AuthContext.jsx → auth state + user role
6. API Design Rules
•	CRUD endpoints ត្រូវស្របគ្នា និង predictable.
•	Filtering/search/pagination ត្រូវទទួលតាម query params.
•	Bulk operations ត្រូវប្រើ endpoint ជាក់លាក់ (ឧ. attendance bulk).
•	Response ត្រូវមាន message ច្បាស់ពេល success/failure.
Module	Endpoint Pattern	Notes
Students	/api/students	CRUD + search + pagination
Teachers	/api/teachers	CRUD + search + pagination
Classes	/api/classes	CRUD + role filter + search + pagination
Attendance	/api/classes/{class}/attendance/bulk	Bulk save per class/date
Dashboard	/api/dashboard	Role-based summary

7. Workflow សម្រាប់បន្ថែម Feature ថ្មី
Feature ថ្មីមួយ មិនគួរចាប់ផ្តើមពី UI មុនទេ។ ត្រូវចាប់ពី business rule → database → backend → frontend → QA។
Step	What to do
1. កំណត់ business goal	Feature នេះដោះស្រាយបញ្ហាអ្វី? Admin ឬ Teacher ជាអ្នកប្រើ?
2. ពិនិត្យ impact លើ model	ត្រូវបន្ថែម table/field ថ្មីទេ? ប៉ះ role/access rules ដែរឬទេ?

3. កំណត់ API contract	មាន route អ្វី, request body អ្វី, response shape បែបណា?
4. សរសេរ validation	ប្រើ Form Request classes ដើម្បីធ្វើ validation និង authorization
5. សរសេរ controller logic	រក្សា business rules ឲ្យនៅ backend
6. Build frontend UI	ប្រើ reusable components មុន, កុំ duplicate ដោយមិនចាំបាច់
7. End-to-end test	Test as admin and teacher separately

8. Feature Addition Template
Template
Feature name:
Business purpose:
Roles affected:
Database changes:
Backend routes:
Validation rules:
Authorization rules:
Frontend pages/components:
Reusable components needed:
QA test cases:
Risks / backward compatibility:

9. Coding Rules សម្រាប់អ្នក build ក្រោយ
•	កុំដាក់ business rules សំខាន់តែខាង React. Laravel ត្រូវ enforce ផង។
•	ពេលមាន pagination កុំ search/filter តែខាង frontend.
•	ពេល feature មាន create/edit forms ត្រូវមាន validation UI ជាផ្នែកមូលដ្ឋាន។
•	ពេល error កុំប្រើតែ alert('Failed'). ត្រូវបង្ហាញ message ពិតពី backend នៅពេល debug.
•	កុំបំបែក structure ដោយដាក់ API calls ក្នុង page ឥតគិតគូរ; ប្រើ src/api/ file ជានិច្ច។
10. Priority Roadmap (Phase 2)
Priority	Feature	Reason
High	Transfer student between classes	Business rule សំខាន់ ប៉ះ class_student history
High	Better validation UI on every form	Improve usability
Medium	Reports / attendance export	Useful for school admin
Medium	Better dialogs instead of browser alert/confirm	Professional UX
Later	Charts and analytics	Nice to have, not core

11. Final Acceptance Checklist
•	Admin flow: login → manage students/teachers/classes → assign student → save attendance → dashboard update
•	Teacher flow: login → view only own classes → save attendance only own class
•	Search + pagination works on Students / Teachers / Classes
•	No page stuck on loading and no obvious console error
•	Forms show validation errors clearly
12. សេចក្តីសន្និដ្ឋាន
Project បច្ចុប្បន្នអាចចាត់ទុកជា MVP ដែលអាចប្រើបាន និងអាចបន្តពង្រីកបាន។ ការបន្ថែម feature ថ្មីគួរធ្វើតាមឯកសារនេះ ដើម្បីរក្សា consistency, role rules, និងភាពងាយស្រួលក្នុងការថែទាំ។
ប្រសិនបើអ្នក build បន្តគម្រោងនេះថ្ងៃក្រោយ សូមចាប់ផ្តើមពី business rule មុន code ជានិច្ច។ នេះជាវិធីដែលធ្វើឲ្យ system មិនរញ៉េរញ៉ៃពេលធំឡើង។

<-- Database in backend use phpmyadmin--

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 05, 2026 at 08:40 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `system_shools`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendances`
--

CREATE TABLE `attendances` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `school_class_id` bigint(20) UNSIGNED NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('present','absent','late','excused') NOT NULL,
  `marked_by` bigint(20) UNSIGNED DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendances`
--

INSERT INTO `attendances` (`id`, `student_id`, `school_class_id`, `attendance_date`, `status`, `marked_by`, `note`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '2026-03-29', 'present', 1, 'On time', '2026-03-29 00:38:57', '2026-03-29 00:38:57'),
(2, 1, 2, '2026-04-04', 'present', 3, NULL, '2026-04-03 22:27:21', '2026-04-03 22:27:21'),
(3, 1, 2, '2026-04-05', 'absent', 3, NULL, '2026-04-04 23:19:05', '2026-04-04 23:20:31');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('laravel-cache-693a611df49ff0318429534c93b99229', 'i:1;', 1775370062),
('laravel-cache-693a611df49ff0318429534c93b99229:timer', 'i:1775370062;', 1775370062),
('laravel-cache-8d3f92cec846e4aeebbbb05de0392c22', 'i:1;', 1775368899),
('laravel-cache-8d3f92cec846e4aeebbbb05de0392c22:timer', 'i:1775368899;', 1775368899),
('laravel-cache-c8290b93873f706e0db1dc9f2ca0f480', 'i:1;', 1775369956),
('laravel-cache-c8290b93873f706e0db1dc9f2ca0f480:timer', 'i:1775369956;', 1775369956),
('laravel-cache-f0c1081d08ad788939c1d20ac121b758', 'i:1;', 1775364505),
('laravel-cache-f0c1081d08ad788939c1d20ac121b758:timer', 'i:1775364505;', 1775364505);

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_student`
--

CREATE TABLE `class_student` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_class_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `joined_at` date DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `class_student`
--

INSERT INTO `class_student` (`id`, `school_class_id`, `student_id`, `joined_at`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '2026-03-27', 'active', '2026-03-27 09:36:01', '2026-03-27 09:36:01'),
(2, 2, 1, '2026-03-29', 'active', '2026-03-29 02:50:54', '2026-03-29 02:50:54'),
(3, 3, 1, '2026-03-30', 'active', '2026-03-30 09:40:12', '2026-03-30 09:40:12'),
(4, 4, 3, '2026-04-04', 'active', '2026-04-03 21:48:43', '2026-04-03 21:48:43');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_03_27_021853_create_personal_access_tokens_table', 1),
(5, '2026_03_27_022045_create_students_table', 1),
(6, '2026_03_27_022046_create_teachers_table', 1),
(7, '2026_03_27_030315_create_school_classes_table', 1),
(8, '2026_03_27_030448_create_attendances_table', 1),
(9, '2026_03_27_030559_create_class_student_table', 1),
(10, '2026_03_29_075421_add_role_to_users_table', 2),
(11, '2026_04_04_063151_create_student_requests_table', 3),
(12, '2026_04_05_055559_create_settings_table', 4);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'api-token', 'fc3212426f58cd35284b8eaeeb068ae714b4536750050252822153c7b78f6cd9', '[\"*\"]', '2026-03-26 20:27:04', NULL, '2026-03-26 20:17:29', '2026-03-26 20:27:04'),
(2, 'App\\Models\\User', 1, 'api-token', 'a7cc4e7d4642afeed848496ec238be90d0757e9da09474fa9b78741e9872eaa2', '[\"*\"]', '2026-03-27 08:31:46', NULL, '2026-03-27 08:25:32', '2026-03-27 08:31:46'),
(3, 'App\\Models\\User', 1, 'api-token', '090da3650ddc48036d21221d12fa9c2f4476b934f3ab48a4d4d88a39c8b3dc5c', '[\"*\"]', '2026-03-27 09:36:40', NULL, '2026-03-27 08:32:28', '2026-03-27 09:36:40'),
(4, 'App\\Models\\User', 1, 'api-token', '69d5ddbb2b1f90edc469b8220d7ccd0c98b6895ddcaf94b9fce6d59b5aa9fa84', '[\"*\"]', '2026-03-29 00:39:08', NULL, '2026-03-29 00:36:42', '2026-03-29 00:39:08'),
(9, 'App\\Models\\User', 3, 'api-token', '9e40e3f8ad082d94341495a2bc4c70f696acc32d4871d6bacf3d07ba29cb17b3', '[\"*\"]', '2026-03-29 01:45:02', NULL, '2026-03-29 01:45:00', '2026-03-29 01:45:02'),
(12, 'App\\Models\\User', 1, 'api-token', '3225a217c3f894658f0c460d8e3b699fc3f5a58cadc23b9c79a3ae18f76fab17', '[\"*\"]', '2026-03-30 09:11:21', NULL, '2026-03-30 09:07:23', '2026-03-30 09:11:21'),
(15, 'App\\Models\\User', 3, 'api-token', '27e55e8f6ea14a64faf3380079867fa4166a1dadf0c3c65d993619ec2f04472e', '[\"*\"]', '2026-03-30 09:53:48', NULL, '2026-03-30 09:40:35', '2026-03-30 09:53:48'),
(16, 'App\\Models\\User', 1, 'api-token', '33cd2b8f42f5efd9df4a76bc4ff116747890166dc81fc2c750fea084070d9118', '[\"*\"]', '2026-03-30 09:55:03', NULL, '2026-03-30 09:54:49', '2026-03-30 09:55:03'),
(17, 'App\\Models\\User', 3, 'api-token', 'aae853dd4cbe2e3635cd1bf7bdf35f8c9cd940a46180bc04d3e8a38f3290d258', '[\"*\"]', '2026-03-30 10:05:47', NULL, '2026-03-30 09:55:09', '2026-03-30 10:05:47'),
(18, 'App\\Models\\User', 1, 'api-token', '30cb5bcb22309f8a0900c6452fa49e4bf27f297f51bd080ca5a259748df7c69b', '[\"*\"]', '2026-03-30 10:08:01', NULL, '2026-03-30 10:06:09', '2026-03-30 10:08:01'),
(19, 'App\\Models\\User', 3, 'api-token', 'c3014090120f8817ddfb8343b6b822e8123825dc43e094f16a849494fc9c1547', '[\"*\"]', '2026-03-30 10:47:46', NULL, '2026-03-30 10:08:30', '2026-03-30 10:47:46'),
(20, 'App\\Models\\User', 1, 'api-token', 'ccecb20d2efc162613478d87f25d47ec9b8af72d93fa2b216cd709bfeb1e843d', '[\"*\"]', NULL, NULL, '2026-04-01 09:33:42', '2026-04-01 09:33:42'),
(22, 'App\\Models\\User', 1, 'api-token', '9666b772e697a856a3521a6e99a98f4c5d000bd95f3e137dfb187ca4a6be63a8', '[\"*\"]', '2026-04-01 09:45:30', NULL, '2026-04-01 09:44:43', '2026-04-01 09:45:30'),
(27, 'App\\Models\\User', 1, 'api-token', '137348024196a0c73bb93069db7f27a054ba3d2355fdb9107b37d5332211b16a', '[\"*\"]', '2026-04-03 22:00:15', NULL, '2026-04-03 21:59:05', '2026-04-03 22:00:15'),
(28, 'App\\Models\\User', 1, 'api-token', '25edb53b6c16530730049a715613d894d574c3fbf8d6467cbe3914aa6cca8892', '[\"*\"]', '2026-04-04 00:55:04', NULL, '2026-04-03 22:51:23', '2026-04-04 00:55:04'),
(29, 'App\\Models\\User', 1, 'api-token', '1d2bd006600da40dec866e077482debcd33b0e59d0e3758d5ab5774676b12369', '[\"*\"]', '2026-04-04 00:00:46', NULL, '2026-04-04 00:00:25', '2026-04-04 00:00:46'),
(30, 'App\\Models\\User', 1, 'api-token', '7336b3c0c0c527532cbe1d6f8fe38b8a31bb059ca2b0dd73df03040f69a90545', '[\"*\"]', '2026-04-04 01:55:02', NULL, '2026-04-04 01:37:34', '2026-04-04 01:55:02'),
(31, 'App\\Models\\User', 1, 'api-token', '4098709e3d221ab0987905e2588b9ab67df20c23fd226c444c994d0454efb8d2', '[\"*\"]', '2026-04-04 02:28:16', NULL, '2026-04-04 02:07:42', '2026-04-04 02:28:16'),
(32, 'App\\Models\\User', 1, 'api-token', '265cd82296f3149b866263119f066120e3b32d565f5c049fb1bcd2f3f5c7e95a', '[\"*\"]', '2026-04-04 09:20:05', NULL, '2026-04-04 08:08:12', '2026-04-04 09:20:05'),
(33, 'App\\Models\\User', 1, 'api-token', '0b9a52899dfe8c8274852095cf38a79cbc225457424990ab7382464741f02163', '[\"*\"]', '2026-04-04 09:50:13', NULL, '2026-04-04 09:18:34', '2026-04-04 09:50:13'),
(34, 'App\\Models\\User', 1, 'api-token', '7f75edd8b28bcf768b0e6aea8d0bde29d58adc916c25439f5bd329b34ef363cd', '[\"*\"]', '2026-04-04 23:02:23', NULL, '2026-04-04 23:00:43', '2026-04-04 23:02:23'),
(38, 'App\\Models\\User', 3, 'api-token', 'fe6dac1d4b0488d53863158870d3ea063763d6755eb41bc024950f93032bf8a9', '[\"*\"]', '2026-04-04 23:18:00', NULL, '2026-04-04 23:17:57', '2026-04-04 23:18:00'),
(40, 'App\\Models\\User', 3, 'api-token', '29a3381395ce5ad050c57e7be11dd579595cb9738058aaec697c737e44d773ad', '[\"*\"]', '2026-04-04 23:30:24', NULL, '2026-04-04 23:20:02', '2026-04-04 23:30:24');

-- --------------------------------------------------------

--
-- Table structure for table `school_classes`
--

CREATE TABLE `school_classes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `section` varchar(255) DEFAULT NULL,
  `academic_year` varchar(255) NOT NULL,
  `room` varchar(255) DEFAULT NULL,
  `teacher_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `school_classes`
--

INSERT INTO `school_classes` (`id`, `name`, `section`, `academic_year`, `room`, `teacher_id`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Grade 7', 'A', '2026', 'Room 01', 1, 'Morning class', 'active', '2026-03-27 09:28:56', '2026-03-27 09:28:56'),
(2, 'Grade 7', 'B', '2026', 'Room 02', 1, 'class', 'active', '2026-03-27 09:29:53', '2026-03-27 09:29:53'),
(3, 'Winter Frazier', 'Distinctio Adipisic', '1985', 'Nam eaque excepturi', 2, 'Sed deleniti eligend', 'inactive', '2026-03-30 09:40:00', '2026-03-30 09:40:00'),
(4, 'web-backend', '1', '3', '003', 3, 'professernal at etec center', 'active', '2026-04-03 21:48:07', '2026-04-03 21:48:07');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('bAFpqY8W4zj5FyxBtyFHifN9lRGuWHFhvFsICepU', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiT0ViV1lLWUJzbXdIcmNNU2JVQnlKNG10clhIUVo1SU1jdjVqalMxOCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1774580878),
('bvWiHQfOZNJ0oXB5s5A47KXBN97XO1sLo92FUwa5', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiaHVlcVBkbWlRNzluaFNJMjdxb3MwMzNzakZGQlB4dWxIMEM0YXV4TCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpJVzhSR1VPZHFvSjFrck9XIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1775292639),
('NCykUISpAVaePuYp4yZY37lDlh0nkUV1ADwuO4nA', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiRnB1aVY2NlMwVG5qbmN6VGdWZGF3UGZzQVNmbUs5RFBSVWJqeDN0UCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1775368785),
('o2714xwzpksgayuMhwuOGzEXxQ5ZuRESCY4Vu5d5', NULL, '192.168.0.128', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiVUpnSUlLNnVLdEhrQ0xNOEVseUpBVVpuNmVRdjRPUU9ncmI4cExZZyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjU6Imh0dHA6Ly8xOTIuMTY4LjAuMTI4OjgwMDAiO3M6NToicm91dGUiO3M6Mjc6ImdlbmVyYXRlZDo6SVc4UkdVT2Rxb0oxa3JPVyI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1775292674);

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `key` varchar(255) NOT NULL,
  `value` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES
(1, 'school_name', 'My School', '2026-04-04 23:02:24', '2026-04-04 23:02:24'),
(2, 'school_phone', '012345678', '2026-04-04 23:02:24', '2026-04-04 23:02:24'),
(3, 'school_email', 'school@example.com', '2026-04-04 23:02:24', '2026-04-04 23:02:24'),
(4, 'school_address', 'Phnom Penh', '2026-04-04 23:02:24', '2026-04-04 23:02:24'),
(5, 'telegram_chat_id', '6832719939', '2026-04-04 23:02:24', '2026-04-04 23:02:24');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_code` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `guardian_name` varchar(255) DEFAULT NULL,
  `guardian_phone` varchar(255) DEFAULT NULL,
  `enrollment_date` date DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `student_code`, `first_name`, `last_name`, `gender`, `date_of_birth`, `phone`, `email`, `address`, `guardian_name`, `guardian_phone`, `enrollment_date`, `status`, `created_at`, `updated_at`) VALUES
(1, 'STU001', 'Sok', 'Dara', 'male', '2005-10-10', '012345678', 'sokdara@example.com', 'Phnom Penh', 'Dara Father', '098765432', '2026-03-27', 'active', '2026-03-27 08:35:58', '2026-03-27 08:35:58'),
(3, '001', 'borey', 'say', 'male', '2004-01-14', '0969300902', 'borey@gmail.com', 'Phnom Penh', NULL, 'nami', '2026-04-18', 'active', '2026-04-03 21:45:15', '2026-04-03 21:45:15');

-- --------------------------------------------------------

--
-- Table structure for table `student_requests`
--

CREATE TABLE `student_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED DEFAULT NULL,
  `student_code_snapshot` varchar(255) NOT NULL,
  `category` enum('teacher_feedback','room_issue','facility_issue','class_request','general_request') NOT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('pending','in_progress','resolved','rejected') NOT NULL DEFAULT 'pending',
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `admin_note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_requests`
--

INSERT INTO `student_requests` (`id`, `student_id`, `student_code_snapshot`, `category`, `subject`, `description`, `status`, `priority`, `admin_note`, `created_at`, `updated_at`) VALUES
(1, 1, 'STU001', 'room_issue', 'Fan not working', 'The classroom fan is not working well.', 'rejected', 'medium', 'ok right now i see something', '2026-04-04 00:20:31', '2026-04-04 00:48:35'),
(2, 3, '001', 'room_issue', 'web backend', 'right in room so hot i want you check fan right why it not work in my class', 'pending', 'low', NULL, '2026-04-04 00:56:35', '2026-04-04 00:56:35'),
(3, 1, 'STU001', 'teacher_feedback', 'It support', 'Fan not work', 'pending', 'high', NULL, '2026-04-04 01:59:28', '2026-04-04 01:59:28'),
(4, 3, '001', 'facility_issue', 'Designer', 'Not well around room', 'pending', 'high', NULL, '2026-04-04 09:20:02', '2026-04-04 09:20:02'),
(5, 3, '001', 'class_request', 'Irure ullamco sint', 'Duis et pariatur Mo', 'pending', 'high', NULL, '2026-04-04 21:11:07', '2026-04-04 21:11:07'),
(6, 3, '001', 'general_request', 'Exercitationem eu do', 'Fugiat id illo dele', 'pending', 'low', NULL, '2026-04-04 21:31:31', '2026-04-04 21:31:31'),
(7, 1, 'STU001', 'facility_issue', 'Mollit ab sint dict', 'In fugit aspernatur', 'pending', 'medium', NULL, '2026-04-04 21:32:24', '2026-04-04 21:32:24'),
(8, 3, '001', 'room_issue', 'In quaerat aut exerc', 'Et quia blanditiis a', 'pending', 'low', NULL, '2026-04-04 21:40:05', '2026-04-04 21:40:05'),
(9, 3, '001', 'general_request', 'Illum est obcaecati', 'Porro duis voluptate', 'pending', 'medium', NULL, '2026-04-04 21:44:27', '2026-04-04 21:44:27'),
(10, 3, '001', 'facility_issue', 'Quo nisi aut quaerat', 'Quidem elit consequ', 'pending', 'high', NULL, '2026-04-04 21:45:05', '2026-04-04 21:45:05'),
(11, 3, '001', 'room_issue', 'Consequuntur amet o', 'Autem ullam sequi ut', 'pending', 'high', NULL, '2026-04-04 21:47:25', '2026-04-04 21:47:25');

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

CREATE TABLE `teachers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `teacher_code` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`id`, `user_id`, `teacher_code`, `first_name`, `last_name`, `gender`, `phone`, `email`, `address`, `hire_date`, `status`, `created_at`, `updated_at`) VALUES
(1, 3, 'T001', 'Vanna Updated', 'Sok', 'male', '099999999', 'vanna.updated@example.com', 'Siem Reap', '2024-01-01', 'active', '2026-03-27 09:16:38', '2026-03-27 09:19:19'),
(2, 3, 'Nam id culpa nisi es', 'Lacy', 'Hodges', 'male', '+1 (558) 752-5242', 'tydeji@mailinator.com', 'Pariatur Laborum vo', '2013-11-06', 'active', '2026-03-29 02:29:30', '2026-03-29 02:29:30'),
(3, NULL, 'T002', 'nat', 'sokphari', 'male', '0969300902', 'sokphari@gmail.com', 'banteay meanchey', '2026-04-04', 'active', '2026-04-03 21:46:52', '2026-04-03 21:46:52');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `role` enum('admin','teacher') NOT NULL DEFAULT 'teacher'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `role`) VALUES
(1, 'Admin', 'admin@example.com', NULL, '$2y$12$tWiHSRQIv76SKYaDlQts0OF3I24uXEESc1Pe9Xri31BtG8zrMvW/m', NULL, '2026-03-26 20:06:59', '2026-03-26 20:06:59', 'admin'),
(3, 'Teacher One', 'teacher@example.com', NULL, '$2y$12$hRmV9.h9QFZWZ/gjBE7Ymeb94SzjcDQXQsqqW8CdVtJ.2Z/3mBQ0K', NULL, '2026-03-29 01:33:40', '2026-03-29 01:33:40', 'teacher');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendances`
--
ALTER TABLE `attendances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `attendances_student_id_school_class_id_attendance_date_unique` (`student_id`,`school_class_id`,`attendance_date`),
  ADD KEY `attendances_school_class_id_foreign` (`school_class_id`),
  ADD KEY `attendances_marked_by_foreign` (`marked_by`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `class_student`
--
ALTER TABLE `class_student`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `class_student_school_class_id_student_id_unique` (`school_class_id`,`student_id`),
  ADD KEY `class_student_student_id_foreign` (`student_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `school_classes`
--
ALTER TABLE `school_classes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `school_classes_teacher_id_foreign` (`teacher_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `settings_key_unique` (`key`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `students_student_code_unique` (`student_code`);

--
-- Indexes for table `student_requests`
--
ALTER TABLE `student_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_requests_student_id_foreign` (`student_id`);

--
-- Indexes for table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `teachers_teacher_code_unique` (`teacher_code`),
  ADD KEY `teachers_user_id_foreign` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendances`
--
ALTER TABLE `attendances`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `class_student`
--
ALTER TABLE `class_student`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `school_classes`
--
ALTER TABLE `school_classes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `student_requests`
--
ALTER TABLE `student_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `teachers`
--
ALTER TABLE `teachers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendances`
--
ALTER TABLE `attendances`
  ADD CONSTRAINT `attendances_marked_by_foreign` FOREIGN KEY (`marked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `attendances_school_class_id_foreign` FOREIGN KEY (`school_class_id`) REFERENCES `school_classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendances_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `class_student`
--
ALTER TABLE `class_student`
  ADD CONSTRAINT `class_student_school_class_id_foreign` FOREIGN KEY (`school_class_id`) REFERENCES `school_classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `class_student_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `school_classes`
--
ALTER TABLE `school_classes`
  ADD CONSTRAINT `school_classes_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `student_requests`
--
ALTER TABLE `student_requests`
  ADD CONSTRAINT `student_requests_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `teachers`
--
ALTER TABLE `teachers`
  ADD CONSTRAINT `teachers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


-- end of database you can copy and past in place this -->
