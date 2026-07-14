<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Struk Pesanan - {{ $order->order_number }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f7f7f7;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .receipt-container {
            max-width: 400px;
            margin: 0 auto;
            background-color: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px dashed #eee;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0 0 10px;
            color: #1a1a1a;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }
        .order-info {
            margin-bottom: 20px;
            font-size: 14px;
        }
        .order-info p {
            margin: 5px 0;
            display: flex;
            justify-content: space-between;
        }
        .item-list {
            margin-bottom: 20px;
        }
        .item {
            margin-bottom: 15px;
        }
        .item-main {
            display: flex;
            justify-content: space-between;
            font-weight: 500;
        }
        .item-options {
            font-size: 12px;
            color: #777;
            padding-left: 20px;
            margin-top: 4px;
        }
        .item-options div {
            display: flex;
            justify-content: space-between;
        }
        .totals {
            border-top: 2px dashed #eee;
            padding-top: 20px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .totals-row.grand-total {
            font-size: 18px;
            font-weight: bold;
            border-top: 1px solid #eee;
            padding-top: 10px;
            margin-top: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 13px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <h1>Olivia Kiosk</h1>
            <p>Terima kasih atas pesanan Anda!</p>
        </div>
        
        <div class="order-info">
            <p><strong>Order #:</strong> <span>{{ $order->order_number }}</span></p>
            <p><strong>Tanggal:</strong> <span>{{ $order->created_at->format('d M Y, H:i') }}</span></p>
            <p><strong>Tipe Pesanan:</strong> <span>{{ $order->order_type === 'dine_in' ? 'Dine In' : 'Take Away' }}</span></p>
            <p><strong>Metode Pembayaran:</strong> <span style="text-transform: uppercase">{{ str_replace('_', ' ', $order->payment_method) }}</span></p>
        </div>

        <div class="item-list">
            @foreach($order->items as $item)
                <div class="item">
                    <div class="item-main">
                        <span>{{ $item->quantity }}x {{ $item->menu_name }}</span>
                        <span>Rp {{ number_format($item->line_total, 0, ',', '.') }}</span>
                    </div>
                    @if(is_array($item->options) && count($item->options) > 0)
                        <div class="item-options">
                            @foreach($item->options as $option)
                                <div>
                                    <span>- {{ $option['optionLabel'] ?? '' }}</span>
                                    @if(isset($option['priceDelta']) && $option['priceDelta'] > 0)
                                        <span>+ Rp {{ number_format($option['priceDelta'], 0, ',', '.') }}</span>
                                    @endif
                                </div>
                            @endforeach
                        </div>
                    @endif
                </div>
            @endforeach
        </div>

        <div class="totals">
            <div class="totals-row">
                <span>Subtotal</span>
                <span>Rp {{ number_format($order->subtotal, 0, ',', '.') }}</span>
            </div>
            <div class="totals-row">
                <span>Pajak (11%)</span>
                <span>Rp {{ number_format($order->tax, 0, ',', '.') }}</span>
            </div>
            <div class="totals-row grand-total">
                <span>Total Bayar</span>
                <span>Rp {{ number_format($order->total, 0, ',', '.') }}</span>
            </div>
        </div>

        <div class="footer">
            <p>Harap tunjukkan struk ini saat mengambil pesanan Anda.</p>
            <p>&copy; {{ date('Y') }} Olivia Kiosk F&B. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
