// src/App.js

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';

// ===================================================================================
// 1. KOMPONEN PREVIEW INVOICE (BAGIAN TAMPILAN KANAN)
// Komponen ini bertanggung jawab untuk menampilkan data invoice secara visual.
// ===================================================================================
const InvoicePreview = ({ data }) => {
  const subtotal = data.items.reduce((acc, item) => acc + Number(item.price || 0), 0);
  const totalCost = subtotal; // Anda bisa menambahkan logika pajak/diskon di sini jika perlu

  return (
    <div id="invoice-preview" className="invoice-preview">
      {/* Gambar header akan ditampilkan oleh CSS */}
      <div className="invoice-header-image"></div>
      
      <div className="invoice-content">
        {/* Detail Klien dan Invoice */}
        <div className="invoice-meta-container">
          <div className="bill-to">
            <h2>Bill To:</h2>
            <p>{data.clientName || 'Nama Klien'}</p>
            <p>{data.clientCity || 'Kota'}</p>
            <p>{data.clientPhone || 'Nomor HP'}</p>
          </div>
          <div className="invoice-meta">
            <h2>Invoice Details:</h2>
            <p><strong>Invoice #:</strong> {data.invoiceNumber}</p>
            <p><strong>Date:</strong> {data.invoiceDate}</p>
            <p><strong>For:</strong> {data.invoiceFor || 'Nama Kegiatan'}</p>
          </div>
        </div>

        {/* Tabel Rincian Item */}
        <table className="item-table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th className="amount-header">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index}>
                <td>{item.description || 'Deskripsi item'}</td>
                <td className="amount">Rp {Number(item.price || 0).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tabel Total Biaya */}
        <div className="totals-section">
          <table className="totals-table">
            <tbody>
              <tr>
                <td className="label">Subtotal</td>
                <td className="amount">Rp {subtotal.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td className="label">Tax Rate</td>
                <td className="amount"></td>
              </tr>
              <tr>
                <td className="label">Other Costs</td>
                <td className="amount"></td>
              </tr>
              <tr className="total-cost">
                <td className="label">Total Cost</td>
                <td className="amount">Rp {totalCost.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Invoice */}
      <div className="invoice-footer">
        <p>Make all checks payable to CreateBox</p>
        <p>If you have any questions, contact: +6285796963601 or createboxpalangkaraya (IG/Email)</p>
        <p className="thank-you">Thank you for your business!</p>
      </div>
    </div>
  );
};


// ===================================================================================
// 2. KOMPONEN UTAMA APLIKASI (LOGIKA & FORM KIRI)
// Di sinilah semua state, logika, dan form input berada.
// ===================================================================================
function App() {
  // STATE 1: Counter untuk nomor invoice, dengan "ingatan permanen" di localStorage.
  const [invoiceCounter, setInvoiceCounter] = useState(() => {
    const savedCounter = localStorage.getItem('invoiceCounter');
    return savedCounter ? parseInt(savedCounter, 10) : 1;
  });
  
  // STATE 2: Objek yang menyimpan semua data dari form.
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '0001',
    invoiceDate: new Date().toISOString().split('T')[0],
    clientName: '',
    clientCity: '',
    clientPhone: '',
    invoiceFor: '',
    items: [{ description: '', price: '' }],
  });

  // EFEK: Berjalan setiap kali 'invoiceCounter' berubah.
  // Tugasnya: memformat nomor invoice baru dan menyimpannya ke state & localStorage.
  useEffect(() => {
    const formattedInvoiceNumber = String(invoiceCounter).padStart(4, '0');
    setInvoiceData(prevData => ({ ...prevData, invoiceNumber: formattedInvoiceNumber }));
    localStorage.setItem('invoiceCounter', invoiceCounter);
  }, [invoiceCounter]);

  // FUNGSI: Menangani perubahan pada input form biasa.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData({ ...invoiceData, [name]: value });
  };

  // FUNGSI: Menangani perubahan pada input deskripsi/harga item.
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...invoiceData.items];
    newItems[index][name] = value;
    setInvoiceData({ ...invoiceData, items: newItems });
  };

  // FUNGSI: Menambah atau mengurangi jumlah baris item.
  const handleItemCountChange = (e) => {
    let count = parseInt(e.target.value, 10);
    if (isNaN(count) || count < 1) count = 1;

    let newItems = [...invoiceData.items];
    if (count > newItems.length) {
      for (let i = newItems.length; i < count; i++) {
        newItems.push({ description: '', price: '' });
      }
    } else {
      newItems = newItems.slice(0, count);
    }
    setInvoiceData({ ...invoiceData, items: newItems });
  };

  // FUNGSI: Membuat dan mengunduh PDF, lalu menyiapkan nomor invoice berikutnya.
  const handleGeneratePdf = () => {
    const input = document.getElementById('invoice-preview');
    html2canvas(input, { scale: 2, useCORS: true })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`invoice-${invoiceData.invoiceNumber}.pdf`);

        // Logika cerdas untuk menyiapkan nomor invoice berikutnya
        const currentNumber = parseInt(invoiceData.invoiceNumber.replace(/\D/g, ''), 10);
        if (!isNaN(currentNumber)) {
          setInvoiceCounter(currentNumber + 1);
        } else {
          setInvoiceCounter(prevCounter => prevCounter + 1);
        }
      });
  };

  // RENDER TAMPILAN
  return (
    <div className="App">
      {/* Kolom Form di Kiri */}
      <div className="form-container">
        <h2>Invoice Generator</h2>
        
        <label>Nomor Invoice</label>
        <input type="text" name="invoiceNumber" value={invoiceData.invoiceNumber} onChange={handleInputChange}/>
        
        <label>Tanggal Invoice</label>
        <input type="date" name="invoiceDate" value={invoiceData.invoiceDate} onChange={handleInputChange} />
        
        <label>Nama Klien</label>
        <input type="text" name="clientName" placeholder="Nama Klien" value={invoiceData.clientName} onChange={handleInputChange} />
        
        <label>Kota Klien</label>
        <input type="text" name="clientCity" placeholder="Kota Klien" value={invoiceData.clientCity} onChange={handleInputChange} />
        
        <label>Nomor HP Klien</label>
        <input type="text" name="clientPhone" placeholder="Nomor HP Klien" value={invoiceData.clientPhone} onChange={handleInputChange} />
        
        <label>Untuk Kegiatan</label>
        <input type="text" name="invoiceFor" placeholder="Nama Kegiatan" value={invoiceData.invoiceFor} onChange={handleInputChange} />
        
        <hr className="form-divider" />

        <label>Jumlah Item</label>
        <input type="number" value={invoiceData.items.length} onChange={handleItemCountChange} min="1" />
        
        {invoiceData.items.map((item, index) => (
          <div key={index} className="item-input">
            <input type="text" name="description" placeholder={`Deskripsi Item ${index + 1}`} value={item.description} onChange={(e) => handleItemChange(index, e)} />
            <input type="number" name="price" placeholder={`Harga`} value={item.price} onChange={(e) => handleItemChange(index, e)} />
          </div>
        ))}
        
        <button onClick={handleGeneratePdf}>Download PDF & Siapkan Invoice Baru</button>
      </div>

      {/* Kolom Preview di Kanan */}
      <div className="preview-container">
        <InvoicePreview data={invoiceData} />
      </div>
    </div>
  );
}

export default App;