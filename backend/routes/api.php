<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ConfigController;
use App\Http\Controllers\Api\DiningTableController;
use App\Http\Controllers\Api\FloorController;
use App\Http\Controllers\Api\FloorSectionController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\ModifierController;
use App\Http\Controllers\Api\ModifierGroupController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductVariantController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\Api\TaxGroupController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::middleware('auth:sanctum')->prefix('shifts')->group(function () {
    Route::post('open', [ShiftController::class, 'open']);
    Route::get('current', [ShiftController::class, 'current']);
    Route::post('{id}/close', [ShiftController::class, 'close']);
});

Route::middleware('auth:sanctum')->get('menu', [MenuController::class, 'show']);

Route::middleware('auth:sanctum')->prefix('orders')->group(function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::post('/', [OrderController::class, 'store']);
    Route::get('{uuid}', [OrderController::class, 'show']);
    Route::post('{uuid}/pay', [OrderController::class, 'pay']);
    Route::post('{uuid}/confirm', [OrderController::class, 'confirm']);
    Route::post('{uuid}/void', [OrderController::class, 'void']);
});

Route::middleware('auth:sanctum')->prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::post('/', [ProductController::class, 'store']);
    Route::get('{id}', [ProductController::class, 'show']);
    Route::put('{id}', [ProductController::class, 'update']);
    Route::put('{id}/modifiers', [ProductController::class, 'updateModifiers']);
    Route::delete('{id}', [ProductController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->prefix('variants')->group(function () {
    Route::post('/', [ProductVariantController::class, 'store']);
    Route::put('{id}', [ProductVariantController::class, 'update']);
    Route::delete('{id}', [ProductVariantController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->prefix('modifier-groups')->group(function () {
    Route::get('/', [ModifierGroupController::class, 'index']);
    Route::post('/', [ModifierGroupController::class, 'store']);
    Route::put('{id}', [ModifierGroupController::class, 'update']);
    Route::delete('{id}', [ModifierGroupController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->prefix('modifiers')->group(function () {
    Route::post('/', [ModifierController::class, 'store']);
    Route::put('{id}', [ModifierController::class, 'update']);
    Route::delete('{id}', [ModifierController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->prefix('tax-groups')->group(function () {
    Route::get('/', [TaxGroupController::class, 'index']);
    Route::post('/', [TaxGroupController::class, 'store']);
    Route::put('{id}', [TaxGroupController::class, 'update']);
    Route::delete('{id}', [TaxGroupController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->prefix('config')->group(function () {
    Route::get('/', [ConfigController::class, 'show']);
    Route::put('/', [ConfigController::class, 'update']);
});

Route::middleware('auth:sanctum')->prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::post('/', [CategoryController::class, 'store']);
    Route::put('{id}', [CategoryController::class, 'update']);
    Route::delete('{id}', [CategoryController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->prefix('floor-sections')->group(function () {
    Route::get('/', [FloorSectionController::class, 'index']);
    Route::post('/', [FloorSectionController::class, 'store']);
    Route::put('{id}', [FloorSectionController::class, 'update']);
    Route::delete('{id}', [FloorSectionController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->prefix('tables')->group(function () {
    Route::post('/', [DiningTableController::class, 'store']);
    Route::put('{id}', [DiningTableController::class, 'update']);
    Route::delete('{id}', [DiningTableController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->prefix('floor')->group(function () {
    Route::get('/', [FloorController::class, 'index']);
    Route::post('sessions', [FloorController::class, 'openSession']);
    Route::put('sessions/{uuid}/close', [FloorController::class, 'closeSession']);
});

Route::middleware('auth:sanctum')->prefix('sync')->group(function () {
    Route::get('menu', [SyncController::class, 'menu']);
    Route::get('customers', [SyncController::class, 'customers']);
});



