<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public const STATUS_PAID = 'paid';
    public const STATUS_PREPARING = 'preparing';
    public const STATUS_READY = 'ready';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    public const PAYMENT_STATUS_PAID = 'paid';

    public const PAYMENT_METHOD_QRIS = 'qris';
    public const PAYMENT_METHOD_CREDIT_CARD = 'credit_card';
    public const PAYMENT_METHOD_VIRTUAL_ACCOUNT = 'virtual_account';

    protected $fillable = [
        'order_number',
        'order_type',
        'delivery_method',
        'table_number',
        'status',
        'payment_status',
        'payment_method',
        'subtotal',
        'tax',
        'total',
        'customer_email',
        'send_email_receipt',
        'print_receipt',
    ];

    protected $casts = [
        'subtotal' => 'integer',
        'tax' => 'integer',
        'total' => 'integer',
        'send_email_receipt' => 'boolean',
        'print_receipt' => 'boolean',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
