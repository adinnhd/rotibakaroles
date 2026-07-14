"use client"

import { useEffect, useRef } from "react"
import { CheckCircle2, Mail, Home, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { translations, type Language } from "@/lib/i18n"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  optionLabel?: string
}

interface ReceiptPageProps {
  cartItems: CartItem[]
  paymentMethod: string
  orderNumber: string
  emailSend: boolean
  onNewOrder: () => void
  language?: Language
}

const paymentMethodNames: Record<string, string> = {
  credit_card: "Credit Card",
  qris: "QRIS",
  virtual_account: "Virtual Account",
}

function formatPrice(price: number) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function formatDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ReceiptPage({ cartItems, paymentMethod, orderNumber, emailSend, onNewOrder, language = "id" }: ReceiptPageProps) {
  const T = translations[language].receipt
  const printRef = useRef<HTMLDivElement>(null)
  
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = Math.round(subtotal * 0.10)
  const total = subtotal + tax
  const currentDate = new Date()

  useEffect(() => {
    // Simulate sending email receipt
    console.log("[v0] Receipt generated for order:", orderNumber)
  }, [orderNumber])

  const handlePrint = async () => {
    // Susun teks struk secara manual untuk dikirim langsung ke printer
    let text = "          KIOSK FNB\n";
    text += "     Self-Order Restaurant\n";
    text += "--------------------------------\n";
    text += `Order: ${orderNumber}\n`;
    text += `${formatDate(currentDate)}\n`;
    text += "--------------------------------\n";
    
    cartItems.forEach(item => {
        let name = item.name.substring(0, 16);
        let qty = `x${item.quantity}`.padEnd(4);
        let price = `${formatPrice(item.price * item.quantity)}`.padStart(10);
        text += `${name.padEnd(16)} ${qty} ${price}\n`;
        if (item.optionLabel) {
            text += `  (${item.optionLabel})\n`;
        }
    });
    
    text += "--------------------------------\n";
    text += "Subtotal:".padEnd(19) + "Rp " + formatPrice(subtotal).padStart(10) + "\n";
    text += "PPN (10%):".padEnd(19) + "Rp " + formatPrice(tax).padStart(10) + "\n";
    text += "--------------------------------\n";
    text += "Total:".padEnd(19) + "Rp " + formatPrice(total).padStart(10) + "\n";
    text += "--------------------------------\n";
    text += "  Terima kasih atas kunjungan\n";
    text += "             Anda!\n";
    text += "\n\n\n\n";

    try {
      // Buka koneksi USB langsung ke printer GDMicroelectronics
      const device = await navigator.usb.requestDevice({
        filters: [{ vendorId: 0x28e9 }] 
      });
      
      await device.open();
      if (device.configuration === null) await device.selectConfiguration(1);
      await device.claimInterface(0);

      // Siapkan perintah ESC/POS (Initialize)
      const encoder = new TextEncoder();
      const init = new Uint8Array([0x1B, 0x40]); 
      const data = encoder.encode(text);
      
      // Gabungkan perintah dan teks
      const buffer = new Uint8Array(init.length + data.length);
      buffer.set(init, 0);
      buffer.set(data, init.length);

      // Cari jalur (endpoint) keluar USB
      const outEndpoint = device.configuration.interfaces[0].alternate.endpoints.find(e => e.direction === 'out');
      
      if (outEndpoint) {
        await device.transferOut(outEndpoint.endpointNumber, buffer);
      }
      
      await device.close();
    } catch (error) {
      console.error(error);
      alert("Akses USB Ditolak oleh Pop!_OS (SecurityError). Kita perlu mengatur izin udev di terminal! Error: " + error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Success Animation */}
      <div className="mb-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{T.successTitle}</h1>
        <p className="text-gray-500 mt-1">{emailSend ? T.successSubtitleEmail : T.successSubtitleDefault}</p>
      </div>

      {/* Receipt Card */}
      <div
        ref={printRef}
        className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden"
      >
        {/* Receipt Header */}
        <div className="bg-red-600 text-white p-6 text-center">
          <h2 className="text-xl font-bold">Olivia</h2>
          <p className="text-red-200 text-sm">Self-Order Restaurant</p>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          {/* Order Info */}
          <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
            <p className="text-sm text-gray-500">{T.orderNumber}</p>
            <p className="text-2xl font-bold text-gray-900">{orderNumber}</p>
            <p className="text-xs text-gray-400 mt-1">{formatDate(currentDate)}</p>
          </div>

          {/* Items */}
          <div className="space-y-3 border-b border-dashed border-gray-300 pb-4 mb-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="text-gray-900 font-medium">{item.name}</p>
                  {item.optionLabel && (
                    <p className="text-gray-500 text-xs mt-0.5">{item.optionLabel}</p>
                  )}
                  <p className="text-gray-500">x{item.quantity}</p>
                </div>
                <p className="text-gray-900">Rp. {formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between text-gray-600">
              <span>{T.subtotal}</span>
              <span>Rp. {formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{T.tax}</span>
              <span>Rp. {formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200">
              <span>{T.total}</span>
              <span>Rp. {formatPrice(total)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-gray-100 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">{T.paidWith}</p>
            <p className="font-semibold text-gray-900">{paymentMethodNames[paymentMethod]}</p>
          </div>

          {/* Email Notice */}
          {emailSend && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
              <Mail className="w-4 h-4" />
              <span>{T.emailNotice}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-md mt-6 space-y-3">
        <Button
          onClick={handlePrint}
          className="w-full h-14 bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 text-lg font-bold rounded-xl"
        >
          <Printer className="w-5 h-5 mr-2" />
          Cetak Struk
        </Button>

        <Button
          onClick={onNewOrder}
          className="w-full h-14 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-xl"
        >
          <Home className="w-5 h-5 mr-2" />
          {T.newOrder}
        </Button>

        <p className="text-center text-sm text-gray-400">
          {T.thankYou}
        </p>
      </div>

      {/* --- AREA STRUK KHUSUS PRINT (58mm) --- */}
      <div className="print-area">
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "14px", marginBottom: "8px" }}>Olivia</div>
        <div style={{ textAlign: "center", marginBottom: "8px" }}>Self-Order Restaurant</div>
        <div style={{ borderTop: "1px dashed black", borderBottom: "1px dashed black", padding: "4px 0", marginBottom: "8px" }}>
          <p>Order: {orderNumber}</p>
          <p>{formatDate(currentDate)}</p>
        </div>
        
        <div style={{ marginBottom: "8px" }}>
          {cartItems.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
              <span>{item.name} {item.optionLabel ? `(${item.optionLabel})` : ""} x{item.quantity}</span>
              <span>Rp {formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px dashed black", paddingTop: "4px", marginBottom: "12px", display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
          <span>Total:</span>
          <span>Rp {formatPrice(total)}</span>
        </div>
        
        <div style={{ textAlign: "center", fontSize: "10px" }}>
          <p>Terima kasih atas kunjungan Anda!</p>
          <p>Pembayaran: {paymentMethodNames[paymentMethod]}</p>
        </div>
      </div>
    </div>
  )
}
