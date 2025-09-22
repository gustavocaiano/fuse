<?php

namespace app\Models;

use app\Concerns\HasOwners;
use app\Contracts\Ownable;
use app\Enums\PTZProtocol;
use Illuminate\Database\Eloquent\Casts\Attribute;
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
        'ptz_protocol_id',
    ];

    protected $casts = [
        'ptz_protocol_id' => PTZProtocol::class,
    ];

    /**
     * Get the PTZ protocol enum
     */
    protected function ptzProtocol(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->ptz_protocol_id,
            set: fn (PTZProtocol|int|null $value) => [
                'ptz_protocol_id' => $value instanceof PTZProtocol ? $value->value : $value,
            ]
        );
    }

    /**
     * Check if this camera supports PTZ
     */
    public function supportsPtz(): bool
    {
        return $this->ptz_protocol !== null;
    }

    /**
     * Get the RTSP URL for this camera
     */
    public function getRtspUrl(): string
    {
        $auth = '';
        if ($this->user) {
            $auth = $this->user;
            if ($this->password) {
                $auth .= ':'.$this->password;
            }
            $auth .= '@';
        }

        $path = $this->path ? '/'.ltrim($this->path, '/') : '';

        return "rtsp://{$auth}{$this->ip_address}:{$this->port}{$path}";
    }

    /**
     * Scope for cameras with PTZ support
     */
    public function scopeWithPtz($query)
    {
        return $query->whereNotNull('ptz_protocol_id');
    }

    /**
     * Scope for cameras with specific PTZ protocol
     */
    public function scopeWithPtzProtocol($query, PTZProtocol $protocol)
    {
        return $query->where('ptz_protocol_id', $protocol->value);
    }
}
