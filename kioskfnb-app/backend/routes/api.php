<?php

use App\Http\Controllers\Admin\MenuCategoryController as AdminMenuCategoryController;
use App\Http\Controllers\Admin\MenuController as AdminMenuController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Kiosk\MenuCategoryController as KioskMenuCategoryController;
use App\Http\Controllers\Kiosk\MenuController as KioskMenuController;
use App\Http\Controllers\Kiosk\OrderController as KioskOrderController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'message' => 'Kiosk FNB API is running',
        'data' => [
            'status' => 'ok',
        ],
        'status' => 'ok',
    ]);
});

Route::prefix('kiosk')->group(function () {
    Route::get('/categories', [KioskMenuCategoryController::class, 'index']);
    Route::get('/menus', [KioskMenuController::class, 'index']);
    Route::get('/menus/{menu}', [KioskMenuController::class, 'show']);
    Route::post('/orders', [KioskOrderController::class, 'store']);
    Route::get('/orders/{orderNumber}', [KioskOrderController::class, 'show']);
    Route::get('/addon-recommendations', [\App\Http\Controllers\AddonRecommendationController::class, 'index']);
});

Route::middleware('web')->prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/categories', [AdminMenuCategoryController::class, 'index']);
    Route::post('/categories', [AdminMenuCategoryController::class, 'store']);
    Route::put('/categories/{category}', [AdminMenuCategoryController::class, 'update']);
    Route::delete('/categories/{category}', [AdminMenuCategoryController::class, 'destroy']);

    Route::get('/menus', [AdminMenuController::class, 'index']);
    Route::post('/menus', [AdminMenuController::class, 'store']);
    Route::post('/menus/{menu}', [AdminMenuController::class, 'update']);
    Route::put('/menus/{menu}', [AdminMenuController::class, 'update']);
    Route::delete('/menus/{menu}', [AdminMenuController::class, 'destroy']);

    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/summary', [AdminOrderController::class, 'summary']);
    Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
    Route::put('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);

    Route::get('/addon-recommendations', [\App\Http\Controllers\AddonRecommendationController::class, 'index']);
    Route::post('/addon-recommendations', [\App\Http\Controllers\AddonRecommendationController::class, 'store']);
    Route::put('/addon-recommendations/{id}', [\App\Http\Controllers\AddonRecommendationController::class, 'update']);
    Route::delete('/addon-recommendations/{id}', [\App\Http\Controllers\AddonRecommendationController::class, 'destroy']);
});
