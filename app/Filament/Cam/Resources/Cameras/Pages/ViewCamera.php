<?php

namespace App\Filament\Cam\Resources\Cameras\Pages;

use App\Filament\Cam\Resources\Cameras\CameraResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewCamera extends ViewRecord
{
    protected static string $resource = CameraResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
