<?php

namespace app\Models;

use app\Concerns\HasOwners;
use app\Contracts\Ownable;
use app\Enums\PTZProtocol;
use Illuminate\Database\Eloquent\Model;

/**
 * @implements Ownable<self>
 *
 * @property string $name
 * @property string $user
 * @property string|null $password
 * @property string|null $path
 * @property string $port
 * @property string|null $ptz
 * @property string $ip_address
 * @property PTZProtocol|null $ptz_protocol
 * @property-read \app\Models\User|null $createdBy
 * @property-read \app\Models\User|null $updatedBy
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Camera newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Camera newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Camera query()
 *
 * @mixin \Eloquent
 */
class Camera extends Model implements Ownable
{
    use HasOwners;

    protected $fillable = [
        'name',
        'user',
        'password',
        'path',
        'port',
        'ptz',
        'ip_address',
    ];
}
