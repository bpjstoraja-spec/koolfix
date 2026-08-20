import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder } from '../../types';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Mail, 
  Wrench, 
  Building2, 
  Globe, 
  CreditCard,
  Copy,
  Check,
  Loader2,
  FileText,
  MessageSquare
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceModalProps {
  order: ServiceOrder;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const { companyProfile, notify } = useApp();
  const printRef = useRef<HTMLDivElement | null>(null);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format clean phone number for WhatsApp (e.g. 0812... -> 62812...)
  const getCleanWhatsAppNumber = (phoneStr: string) => {
    let cleaned = phoneStr.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  // Build clean text summary for WhatsApp / Clipboard
  const getInvoiceTextSummary = () => {
    const serviceItemsList = order.serviceItems
      .map(item => `• ${item.categoryName} (${item.unitCount} unit) - Rp ${item.totalPrice.toLocaleString('id-ID')}`)
      .join('\n');

    const sparePartsList = order.sparePartsUsed && order.sparePartsUsed.length > 0
      ? '\n*Suku Cadang:*\n' + order.sparePartsUsed.map(p => `• ${p.name} (${p.quantity} ${p.unit}) - Rp ${p.totalPrice.toLocaleString('id-ID')}`).join('\n')
      : '';

    const techNames = order.assignedTechnicians && order.assignedTechnicians.length > 0
      ? order.assignedTechnicians.map(t => `${t.technicianName} (${t.roleInJob})`).join(', ')
      : (order.technicianName || 'Tim Teknisi');

    return `*FAKTUR RESMI SERVIS AC - ${companyProfile.name.toUpperCase()}*
No. Faktur: *${order.orderNumber}*
Tanggal: ${order.scheduledDate} (${order.scheduledTimeSlot} WIB)
Pelanggan: *${order.customerName}* ${order.companyName ? `(${order.companyName})` : ''}
Alamat: ${order.customerAddress}
Kontak: ${order.customerPhone}

*Rincian Pengerjaan:*
${serviceItemsList}${sparePartsList}

*Subtotal Jasa:* Rp ${order.totalServicePrice.toLocaleString('id-ID')}
${order.totalSparePartsPrice > 0 ? `*Subtotal Suku Cadang:* Rp ${order.totalSparePartsPrice.toLocaleString('id-ID')}\n` : ''}${order.discountAmount > 0 ? `*Diskon:* - Rp ${order.discountAmount.toLocaleString('id-ID')}\n` : ''}*TOTAL PEMBAYARAN:* *Rp ${order.grandTotal.toLocaleString('id-ID')}*
*Status Pembayaran:* *${order.paymentStatus === 'LUNAS' ? 'LUNAS (PAID) ✓' : 'BELUM LUNAS'}*

*Teknisi Bertugas:* ${techNames}
*Garansi Pengerjaan:* 30 Hari

${companyProfile.bankAccountDetails ? `*Rekening Pembayaran Resmi:*\n${companyProfile.bankAccountDetails}\n` : ''}
*${companyProfile.name}*
${companyProfile.address}
Telp/WA: ${companyProfile.phone}
${companyProfile.website ? `Website: ${companyProfile.website}` : ''}
Terima kasih atas kepercayaan Anda!`;
  };

  // Dedicated Print Helper (with iframe & fallback)
  const handlePrint = async () => {
    if (!printRef.current) return;
    setIsPrinting(true);

    try {
      // 1. Create a hidden isolated iframe
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = 'none';
      printIframe.style.visibility = 'hidden';
      document.body.appendChild(printIframe);

      const iframeDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
      if (!iframeDoc) {
        throw new Error('Gagal menginisialisasi modul cetak');
      }

      // 2. Build full HTML with standalone print CSS styles
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Faktur - ${order.orderNumber} - ${companyProfile.name}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              font-size: 11pt;
              line-height: 1.4;
              padding: 10px;
            }
            .invoice-wrapper {
              max-width: 800px;
              margin: 0 auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            th, td {
              padding: 8px 10px;
              border: 1px solid #cbd5e1;
              text-align: left;
            }
            th {
              background-color: #f1f5f9 !important;
              color: #0f172a;
              font-weight: bold;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .font-mono { font-family: monospace; }
            .badge-lunas {
              display: inline-block;
              padding: 4px 10px;
              background-color: #ecfdf5 !important;
              color: #047857;
              border: 1px solid #a7f3d0;
              border-radius: 6px;
              font-weight: bold;
            }
            .badge-belum {
              display: inline-block;
              padding: 4px 10px;
              background-color: #fef2f2 !important;
              color: #b91c1c;
              border: 1px solid #fecaca;
              border-radius: 6px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            ${printRef.current.innerHTML}
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();

      // 3. Wait for images and resources to render
      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
          notify?.('Memproses dialog cetak faktur...', 'info');
        } catch (err) {
          console.warn('Iframe print error, falling back to direct print:', err);
          window.print();
        }

        // Clean up iframe after print dialog
        setTimeout(() => {
          if (document.body.contains(printIframe)) {
            document.body.removeChild(printIframe);
          }
          setIsPrinting(false);
        }, 2000);
      }, 500);

    } catch (error) {
      console.error('Print failed:', error);
      // Fallback: trigger PDF download
      notify?.('Membuka faktur via PDF generator...', 'info');
      await handleDownloadPDF();
      setIsPrinting(false);
    }
  };

  // Generate jsPDF Document
  const generatePDFDocument = async () => {
    if (!printRef.current) throw new Error('Elemen faktur tidak ditemukan');

    const canvas = await html2canvas(printRef.current, {
      scale: 2, // High resolution for crisp text & graphics
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return { pdf, canvas };
  };

  // Download PDF file
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPDF(true);

    try {
      const { pdf } = await generatePDFDocument();
      const filename = `Faktur-KOOLFIX-${order.orderNumber}.pdf`;
      pdf.save(filename);
      notify?.(`Faktur berhasil diunduh: ${filename}`, 'success');
    } catch (error) {
      console.error('PDF generation failed:', error);
      notify?.('Gagal membuat file PDF. Silakan coba lagi.', 'error');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Share via Web Share API or WhatsApp
  const handleSharePDF = async () => {
    if (!printRef.current) return;
    setIsSharing(true);

    try {
      const { pdf } = await generatePDFDocument();
      const filename = `Faktur-KOOLFIX-${order.orderNumber}.pdf`;
      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      // Check if Web Share API with files is supported (mobile browsers, tablets, modern OS)
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Faktur Servis AC - ${order.orderNumber}`,
          text: `Faktur resmi pengerjaan servis AC untuk ${order.customerName} (${companyProfile.name})`
        });
        notify?.('Faktur berhasil dibagikan!', 'success');
      } else {
        // Fallback on desktop or unsupported browsers:
        // Automatically download the PDF and open WhatsApp with pre-filled summary text
        pdf.save(filename);
        notify?.('File PDF tersimpan. Membuka WhatsApp untuk pengiriman ke pelanggan...', 'info');
        handleWhatsAppShare();
      }
    } catch (error: any) {
      // User aborted share or browser error
      if (error?.name !== 'AbortError') {
        console.error('Share failed:', error);
        notify?.('Membuka alternatif pengiriman via WhatsApp...', 'info');
        handleWhatsAppShare();
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Direct WhatsApp Launcher
  const handleWhatsAppShare = () => {
    const cleanPhone = getCleanWhatsAppNumber(order.customerPhone);
    const message = getInvoiceTextSummary();
    const encodedText = encodeURIComponent(message);
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    notify?.('Membuka WhatsApp untuk mengirim faktur ke pelanggan', 'success');
  };

  // Copy summary to clipboard
  const handleCopyText = async () => {
    try {
      const text = getInvoiceTextSummary();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      notify?.('Ringkasan faktur berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      notify?.('Gagal menyalin teks', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-slate-200 text-slate-900 flex flex-col max-h-[95vh]">
        
        {/* Top Actions Bar (Hidden when printed) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-slate-900 text-white shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-white tracking-tight truncate">
                Faktur & Berita Acara Servis AC
              </h3>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {order.orderNumber} • {order.customerName}
              </p>
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Print Button */}
            <button
              id="btn-print-invoice"
              onClick={handlePrint}
              disabled={isPrinting || isGeneratingPDF}
              title="Cetak faktur ke printer fisik atau simpan PDF sistem"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>{isPrinting ? 'Mencetak...' : 'Cetak Faktur'}</span>
            </button>

            {/* Download PDF Button */}
            <button
              id="btn-download-pdf-invoice"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF || isPrinting}
              title="Download file faktur resmi format .PDF"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGeneratingPDF ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </button>

            {/* Share PDF Button */}
            <button
              id="btn-share-pdf-invoice"
              onClick={handleSharePDF}
              disabled={isSharing || isGeneratingPDF}
              title="Bagikan dokumen PDF langsung ke WhatsApp, Telegram, atau Aplikasi Lainnya"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSharing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span>{isSharing ? 'Membagikan...' : 'Share PDF'}</span>
            </button>

            {/* Send to WhatsApp Direct Button */}
            <button
              id="btn-whatsapp-invoice"
              onClick={handleWhatsAppShare}
              title="Kirim rincian faktur ke nomor WhatsApp pelanggan"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Copy Text Summary */}
            <button
              id="btn-copy-invoice-summary"
              onClick={handleCopyText}
              title="Salin rincian faktur ke clipboard"
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              id="btn-close-invoice-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
          
          {/* Printable Invoice Paper Frame */}
          <div 
            ref={printRef} 
            className="w-full max-w-[760px] bg-white text-slate-800 text-xs p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200 select-text"
          >
            {/* Header with Dynamic Company Profile */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5 mb-5">
              <div>
                <div className="flex items-center gap-3">
                  {companyProfile.logoUrl ? (
                    <img 
                      src={companyProfile.logoUrl} 
                      alt={companyProfile.name} 
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                      KF
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                      {companyProfile.name}
                    </h1>
                    <p className="text-xs text-blue-700 font-bold">
                      {companyProfile.tagline || 'Layanan Servis & Pemeliharaan AC Profesional'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600 space-y-0.5 max-w-md">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 
                    <span>{companyProfile.address}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 
                    <span>Telp/WA: <strong>{companyProfile.phone}</strong></span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 
                    <span>Email: {companyProfile.email} {companyProfile.website ? `| Web: ${companyProfile.website}` : ''}</span>
                  </p>
                  {companyProfile.taxIdentificationNumber && (
                    <p className="text-[11px] text-slate-500 font-mono">
                      NPWP: {companyProfile.taxIdentificationNumber}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-200 uppercase tracking-wide">
                  FAKTUR RESMI
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-2 font-mono">{order.orderNumber}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tanggal: {order.scheduledDate}</p>
                <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${
                  order.paymentStatus === 'LUNAS' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Status: {order.paymentStatus === 'LUNAS' ? 'LUNAS (PAID)' : 'BELUM LUNAS'}
                </div>
              </div>
            </div>

            {/* Customer & Technician Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl mb-5 border border-slate-200">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">PELANGGAN</p>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">{order.customerName}</h4>
                {order.companyName && (
                  <p className="text-xs font-semibold text-blue-600">{order.companyName}</p>
                )}
                <p className="text-xs text-slate-600 mt-1">{order.customerAddress}</p>
                <p className="text-xs text-slate-600 mt-0.5">Telp/WA: <strong>{order.customerPhone}</strong></p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">TEKNISI BERTUGAS</p>
                {order.assignedTechnicians && order.assignedTechnicians.length > 0 ? (
                  <div className="mt-0.5 space-y-1">
                    {order.assignedTechnicians.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
                        <span>• {t.technicianName}</span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          ({t.roleInJob === 'LEAD' ? 'Lead Teknisi' : 'Asisten'})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">{order.technicianName || 'Tim KoolFix'}</h4>
                )}
                <p className="text-xs text-slate-600 mt-1">Waktu Servis: {order.scheduledTimeSlot} WIB</p>
                {order.paymentMethod && (
                  <p className="text-xs text-slate-600 mt-0.5">Metode Bayar: <span className="font-semibold">{order.paymentMethod}</span></p>
                )}
              </div>
            </div>

            {/* Technical Diagnostics (If available) */}
            {order.technicalReport && (
              <div className="mb-5 p-4 rounded-xl border border-blue-200 bg-blue-50/40">
                <h4 className="text-xs font-bold uppercase text-blue-900 tracking-wider flex items-center gap-1.5 mb-2.5">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  Laporan Parameter Teknis & Hasil Servis
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs mb-2.5">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Tekanan Freon</span>
                    <span className="font-bold text-slate-900">
                      {order.technicalReport.initialFreonPressurePsi || '-'} → {order.technicalReport.finalFreonPressurePsi || '-'} PSI
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Arus Listrik</span>
                    <span className="font-bold text-slate-900">
                      {order.technicalReport.ampereReading ? `${order.technicalReport.ampereReading} A` : '-'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Suhu Hembusan</span>
                    <span className="font-bold text-slate-900">
                      {order.technicalReport.initialTempCelsius || '-'}°C → {order.technicalReport.finalTempCelsius || '-'}°C
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Drainase</span>
                    <span className="font-bold text-emerald-600">
                      {order.technicalReport.drainageChecked ? '✓ Lancar & Bersih' : '-'}
                    </span>
                  </div>
                </div>
                {order.technicalReport.notes && (
                  <p className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900">Catatan Teknisi: </span>
                    {order.technicalReport.notes}
                  </p>
                )}
              </div>
            )}

            {/* Service Items Table */}
            <div className="mb-5">
              <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Rincian Jasa & Pekerjaan</h4>
              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3">Deskripsi Layanan Servis</th>
                      <th className="py-2 px-3 text-center">Jumlah</th>
                      <th className="py-2 px-3 text-right">Harga Satuan</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.serviceItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{item.categoryName}</td>
                        <td className="py-2 px-3 text-center">{item.unitCount} unit</td>
                        <td className="py-2 px-3 text-right">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-900">
                          Rp {item.totalPrice.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                    {order.sparePartsUsed && order.sparePartsUsed.map((part, idx) => (
                      <tr key={`part-${idx}`} className="bg-amber-50/40">
                        <td className="py-2 px-3 text-slate-500">{order.serviceItems.length + idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          [Suku Cadang] {part.name} ({part.code})
                        </td>
                        <td className="py-2 px-3 text-center">{part.quantity} {part.unit}</td>
                        <td className="py-2 px-3 text-right">Rp {part.unitPrice.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-900">
                          Rp {part.totalPrice.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pricing Totals & Guarantee */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
              <div className="max-w-xs text-xs text-slate-500">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  Garansi Pengerjaan 30 Hari
                </div>
                <p className="text-[11px] leading-relaxed">
                  Garansi berlaku untuk jenis pengerjaan dan suku cadang yang tertera di faktur ini. Simpan nomor faktur untuk klaim garansi servis.
                </p>
              </div>

              <div className="w-full sm:w-64 space-y-1.5 text-xs text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Jasa:</span>
                  <span className="font-semibold text-slate-800">Rp {order.totalServicePrice.toLocaleString('id-ID')}</span>
                </div>
                {order.totalSparePartsPrice > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Suku Cadang:</span>
                    <span className="font-semibold text-slate-800">Rp {order.totalSparePartsPrice.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon / Potongan:</span>
                    <span>- Rp {order.discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t border-slate-300 pt-1.5 flex justify-between text-sm sm:text-base font-bold text-slate-900">
                  <span>Total Pembayaran:</span>
                  <span className="text-blue-700">Rp {order.grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Bank Account & Payment Instructions (If available) */}
            {companyProfile.bankAccountDetails && (
              <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5">
                <CreditCard className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-800">Informasi Pembayaran / Rekening Resmi:</p>
                  <p className="text-slate-600 font-mono text-[11px] mt-0.5 whitespace-pre-line">
                    {companyProfile.bankAccountDetails}
                  </p>
                </div>
              </div>
            )}

            {/* Signatures & Stamps */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-center text-xs">
              <div>
                <p className="text-slate-500 font-medium">Pelanggan,</p>
                <div className="h-14 flex items-center justify-center my-1">
                  {order.technicalReport?.customerSignature ? (
                    <img
                      src={order.technicalReport.customerSignature}
                      alt="Tanda Tangan Pelanggan"
                      className="max-h-12 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-slate-400 italic text-[10px]">(Telah Menyetujui)</div>
                  )}
                </div>
                <p className="font-bold text-slate-800 border-t border-slate-300 pt-1 inline-block min-w-28 truncate">
                  {order.customerName}
                </p>
              </div>

              <div>
                <p className="text-slate-500 font-medium">Teknisi Bertugas,</p>
                <div className="h-14 flex items-center justify-center my-1">
                  <div className="w-12 h-12 rounded-full border border-blue-400 bg-blue-50/50 flex flex-col items-center justify-center text-[7px] font-bold text-blue-700 leading-tight">
                    <span>VERIFIED</span>
                    <span>SERVICE</span>
                  </div>
                </div>
                <p className="font-bold text-slate-800 border-t border-slate-300 pt-1 inline-block min-w-28 truncate">
                  {order.assignedTechnicians?.[0]?.technicianName || order.technicianName || 'Tim Teknisi'}
                </p>
              </div>

              <div>
                <p className="text-slate-500 font-medium">{companyProfile.personInChargeTitle || 'Penanggung Jawab'},</p>
                <div className="h-14 flex items-center justify-center my-1">
                  <div className="px-2.5 py-1 rounded-lg border border-emerald-400/60 bg-emerald-50 text-[9px] font-bold text-emerald-800 uppercase tracking-wider">
                    {companyProfile.name.split(' ')[0]} SAH
                  </div>
                </div>
                <p className="font-bold text-slate-800 border-t border-slate-300 pt-1 inline-block min-w-28 truncate">
                  {companyProfile.personInCharge || 'Super Admin'}
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
