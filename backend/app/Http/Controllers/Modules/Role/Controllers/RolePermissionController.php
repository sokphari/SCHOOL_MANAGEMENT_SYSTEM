<?php

namespace App\Http\Controllers\Modules\Role\Controllers;

use App\Http\Controllers\Controller;
use App\Models\RoleFeaturePermission;
use App\Models\RoleModulePermission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RolePermissionController extends Controller
{
    public function showTeacherPermissions()
    {
        $definitions = config('role_permissions.teacher_modules');
        $moduleAccess = RoleModulePermission::query()
            ->where('role', 'teacher')
            ->pluck('allowed', 'module');
        $featureAccess = RoleFeaturePermission::query()
            ->where('role', 'teacher')
            ->get(['module', 'feature', 'allowed'])
            ->keyBy(fn (RoleFeaturePermission $permission) => $permission->module.'.'.$permission->feature);

        return response()->json([
            'role' => 'teacher',
            'modules' => collect($definitions)->map(function (array $definition, string $module) use ($moduleAccess, $featureAccess) {
                return [
                    'key' => $module,
                    'label' => $definition['label'],
                    'allowed' => (bool) ($moduleAccess[$module] ?? false),
                    'features' => collect($definition['features'])->map(fn (string $label, string $feature) => [
                        'key' => $feature,
                        'label' => $label,
                        'allowed' => (bool) ($featureAccess[$module.'.'.$feature]->allowed ?? false),
                    ])->values(),
                ];
            })->values(),
        ]);
    }

    public function updateTeacherPermissions(Request $request)
    {
        $data = $request->validate([
            'modules' => ['required', 'array'],
            'modules.*' => ['required', 'boolean'],
            'features' => ['sometimes', 'array'],
            'features.*' => ['array'],
            'features.*.*' => ['boolean'],
        ]);

        $definitions = config('role_permissions.teacher_modules');
        $unknownModules = array_diff(array_merge(array_keys($data['modules']), array_keys($data['features'] ?? [])), array_keys($definitions));
        if ($unknownModules !== []) {
            throw ValidationException::withMessages(['modules' => ['One or more modules are not configurable for teachers.']]);
        }

        foreach ($data['features'] ?? [] as $module => $features) {
            $unknownFeatures = array_diff(array_keys($features), array_keys($definitions[$module]['features']));
            if ($unknownFeatures !== []) {
                throw ValidationException::withMessages(['features' => ['One or more features are not configurable for this module.']]);
            }
        }

        foreach (config('role_permissions.feature_dependencies') as $feature => $dependencies) {
            [$module, $featureKey] = explode('.', $feature, 2);
            if (! ($data['features'][$module][$featureKey] ?? false)) {
                continue;
            }

            foreach ($dependencies as $dependency) {
                [$dependencyModule, $dependencyKey] = explode('.', $dependency, 2);
                if (array_key_exists($dependencyKey, $data['features'][$dependencyModule] ?? [])
                    && ! $data['features'][$dependencyModule][$dependencyKey]) {
                    throw ValidationException::withMessages([
                        'features' => ["The {$featureKey} feature requires {$dependencyKey} access."],
                    ]);
                }
            }
        }

        DB::transaction(function () use ($data, $definitions): void {
            foreach ($definitions as $module => $definition) {
                RoleModulePermission::updateOrCreate(
                    ['role' => 'teacher', 'module' => $module],
                    ['allowed' => (bool) ($data['modules'][$module] ?? false)],
                );

                foreach ($definition['features'] as $feature => $_label) {
                    if (array_key_exists($feature, $data['features'][$module] ?? [])) {
                        RoleFeaturePermission::updateOrCreate(
                            ['role' => 'teacher', 'module' => $module, 'feature' => $feature],
                            ['allowed' => (bool) $data['features'][$module][$feature]],
                        );
                    }
                }
            }
        });

        return $this->showTeacherPermissions();
    }
}
