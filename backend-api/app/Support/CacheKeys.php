<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CacheKeys
{
    public static function make(string $scope, array $params = []): string
    {
        ksort($params);

        return sprintf(
            'api:%s:v%s:%s',
            $scope,
            self::version($scope),
            md5(json_encode($params))
        );
    }

    public static function requestParams(Request $request, array $keys): array
    {
        $params = [];

        foreach ($keys as $key) {
            if (!$request->has($key) || $request->input($key) === null || $request->input($key) === '') {
                continue;
            }

            $value = $request->input($key);

            if (in_array($key, ['latitude', 'longitude'], true) && is_numeric($value)) {
                $value = round((float) $value, 3);
            }

            $params[$key] = $value;
        }

        ksort($params);

        return $params;
    }

    public static function bump(string $scope): void
    {
        $key = self::versionKey($scope);
        $version = (int) Cache::get($key, 1);

        Cache::forever($key, $version + 1);
    }

    private static function version(string $scope): int
    {
        return (int) Cache::get(self::versionKey($scope), 1);
    }

    private static function versionKey(string $scope): string
    {
        return "cache-version:{$scope}";
    }
}
