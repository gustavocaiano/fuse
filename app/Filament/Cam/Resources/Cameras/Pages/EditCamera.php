<?php

namespace App\Filament\Cam\Resources\Cameras\Pages;

use App\Filament\Cam\Resources\Cameras\CameraResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditCamera extends EditRecord
{
    protected static string $resource = CameraResource::class;

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            DeleteAction::make(),
        ];
    }
}
