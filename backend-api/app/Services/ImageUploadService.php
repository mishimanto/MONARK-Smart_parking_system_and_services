<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\Drivers\Imagick\Driver as ImagickDriver;
use Intervention\Image\ImageManager;

class ImageUploadService
{
    public function storePublicImage(UploadedFile $file, string $directory, array $options = []): array
    {
        $directory = trim($directory, '/');
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');

        if (($options['allow_ico'] ?? false) && $extension === 'ico') {
            $filename = $this->makeFilename('ico', $options['prefix'] ?? null);
            $path = $file->storeAs($directory, $filename, 'public');

            return $this->responsePayload($path, 'ico');
        }

        $format = strtolower($options['format'] ?? 'webp');
        $quality = (int) ($options['quality'] ?? 82);
        $path = $directory . '/' . $this->makeFilename($format, $options['prefix'] ?? null);
        $image = $this->manager()->read($file->getRealPath());

        if (($options['fit'] ?? null) === 'cover' && !empty($options['width']) && !empty($options['height'])) {
            $image->coverDown((int) $options['width'], (int) $options['height']);
        } elseif (!empty($options['width']) || !empty($options['height'])) {
            $image->scaleDown(
                width: !empty($options['width']) ? (int) $options['width'] : null,
                height: !empty($options['height']) ? (int) $options['height'] : null,
            );
        }

        $encoded = match ($format) {
            'jpg', 'jpeg' => $image->toJpeg(quality: $quality),
            'png' => $image->toPng(),
            default => $image->toWebp(quality: $quality),
        };

        Storage::disk('public')->put($path, (string) $encoded);

        return $this->responsePayload($path, $format);
    }

    public function deletePublicImage(?string $value): void
    {
        $path = $this->publicPathFromValue($value);

        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    private function manager(): ImageManager
    {
        $driver = extension_loaded('imagick') ? new ImagickDriver() : new GdDriver();

        return new ImageManager($driver);
    }

    private function makeFilename(string $extension, ?string $prefix = null): string
    {
        $base = trim((string) $prefix) ?: 'image';
        $base = Str::slug($base) ?: 'image';

        return $base . '-' . now()->format('YmdHis') . '-' . Str::random(10) . '.' . $extension;
    }

    private function responsePayload(string $path, string $extension): array
    {
        return [
            'path' => $path,
            'url' => 'storage/' . $path,
            'extension' => $extension,
            'size' => Storage::disk('public')->size($path),
        ];
    }

    private function publicPathFromValue(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        $value = trim(str_replace('\\', '/', $value));

        if ($value === '' || Str::startsWith($value, ['http://', 'https://', 'data:', '/images/', 'images/'])) {
            return null;
        }

        return ltrim(preg_replace('#^/?storage/#', '', $value), '/');
    }
}
