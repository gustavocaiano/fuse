<?php

namespace app\Enums;

use app\Concerns\HasFromOr;
use App\PTZ\Contracts\PTZControllerInterface;
use App\PTZ\Services\Controllers\HikvisionController;
use App\PTZ\Services\Controllers\OnvifController;

enum PTZProtocol: int
{
    use HasFromOr;

    case ONVIF = 1;
    case HIKVISION = 2;

    /**
     * @return self[]
     */
    public static function except(self ...$cases): array
    {
        return array_filter(
            self::cases(),
            fn ($case) => ! in_array($case, $cases, true)
        );
    }

    /**
     * Get the controller class for this protocol
     */
    public function getControllerClass(): string
    {
        return match ($this) {
            self::ONVIF => OnvifController::class,
            self::HIKVISION => HikvisionController::class,
        };
    }

    /**
     * Create a new controller instance for this protocol
     */
    public function createController(): PTZControllerInterface
    {
        $controllerClass = $this->getControllerClass();

        return new $controllerClass;
    }

    /**
     * Get human-readable name for the protocol
     */
    public function getName(): string
    {
        return match ($this) {
            self::ONVIF => 'ONVIF',
            self::HIKVISION => 'Hikvision',
        };
    }

    /**
     * Get description of the protocol
     */
    public function getDescription(): string
    {
        return match ($this) {
            self::ONVIF => 'Standard ONVIF protocol - works with most IP cameras',
            self::HIKVISION => 'Hikvision proprietary API - optimized for Hikvision cameras',
        };
    }
}
