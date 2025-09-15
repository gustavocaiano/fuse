<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CameraController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Camera Management API Routes
// Route::prefix('api/cameras')->group(function () {
//     // List cameras (filter by access for non-admin)
//     Route::get('/', [CameraController::class, 'index']);
    
//     // Create camera
//     Route::post('/', [CameraController::class, 'store']);
    
//     // Get specific camera (hide rtsp for non-admin)
//     Route::get('/{id}', [CameraController::class, 'show']);
    
//     // Delete camera
//     Route::delete('/{id}', [CameraController::class, 'destroy']);
    
//     // Update camera recording preference
//     Route::post('/{id}/recording', [CameraController::class, 'updateRecording']);
    
//     // Start HLS streaming for camera
//     Route::post('/{id}/start', [CameraController::class, 'startStreaming']);
    
//     // Stop HLS streaming for camera
//     Route::post('/{id}/stop', [CameraController::class, 'stopStreaming']);
    
//     // Get camera status
//     Route::get('/{id}/status', [CameraController::class, 'status']);
    
//     // PTZ Controls
//     Route::post('/{id}/ptz/move', [CameraController::class, 'ptzMove']);
//     Route::post('/{id}/ptz/stop', [CameraController::class, 'ptzStop']);
    
//     // Recording Management
//     Route::get('/{id}/recordings/years', [CameraController::class, 'recordingYears']);
//     Route::get('/{id}/recordings/{year}/months', [CameraController::class, 'recordingMonths']);
//     Route::get('/{id}/recordings/{year}/{month}/days', [CameraController::class, 'recordingDays']);
//     Route::get('/{id}/recordings/{year}/{month}/{day}/hours', [CameraController::class, 'recordingHours']);
//     Route::get('/{id}/recordings/{year}/{month}/{day}/{hour}/files', [CameraController::class, 'recordingFiles']);
    
//     // Video access token
//     Route::post('/{id}/recordings/{year}/{month}/{day}/{hour}/token/{filename}', [CameraController::class, 'generateVideoToken']);
    
//     // Serve recorded video files
//     Route::get('/{id}/recordings/{year}/{month}/{day}/{hour}/file/{filename}', [CameraController::class, 'serveVideoFile']);
    
//     // Storage Management (Admin only)
//     Route::get('/storage/info', [CameraController::class, 'storageInfo']);
//     Route::post('/storage/cleanup', [CameraController::class, 'storageCleanup']);
// });

// // User Management API Routes
// Route::prefix('api/users')->group(function () {
//     // Create user (admin only if caller is admin; if no users exist, allow bootstrapping)
//     Route::post('/', [UserController::class, 'store']);
    
//     // Current user
//     Route::get('/me', [UserController::class, 'me']);
    
//     // List users (admin only)
//     Route::get('/', [UserController::class, 'index']);
    
//     // Grant camera access (admin only)
//     Route::post('/{userId}/access/{cameraId}', [UserController::class, 'grantAccess']);
    
//     // Revoke camera access (admin only)
//     Route::delete('/{userId}/access/{cameraId}', [UserController::class, 'revokeAccess']);
    
//     // List camera IDs current user can access
//     Route::get('/me/cameras', [UserController::class, 'myCameras']);
    
//     // Admin can update camera name/rtsp
//     Route::put('/cameras/{id}', [UserController::class, 'updateCamera']);
    
//     // List users who have access to a camera (admin only)
//     Route::get('/cameras/{cameraId}/users', [UserController::class, 'cameraUsers']);
// });

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
