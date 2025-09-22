<?php

namespace app\Contracts;

use app\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @template TModel of Model
 */
interface Ownable
{
    /**
     * @return BelongsTo<User, TModel>
     */
    public function createdBy(): BelongsTo;

    /**
     * @return BelongsTo<User, TModel>
     */
    public function updatedBy(): BelongsTo;
}
