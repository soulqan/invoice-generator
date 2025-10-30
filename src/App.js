// src/App.js

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';

// 🔧 Fungsi bantu: format tanggal dua arah
const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
};

// ===================================================================================
// 1. KOMPONEN PREVIEW INVOICE
// ===================================================================================
const InvoicePreview = ({ data }) => {
  const subtotal = data.items.reduce((acc, item) => acc + Number(item.price || 0), 0);
  const totalCost = subtotal;

  return (
    <div id="invoice-preview" className="invoice-preview">
      <div className="invoice-header-image"></div>

      <div className="invoice-content">
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
            <p><strong>Date:</strong> {formatDateToDDMMYYYY(data.invoiceDate)}</p>
            <p><strong>For:</strong> {data.invoiceFor || 'Nama Kegiatan'}</p>
          </div>
        </div>

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

      <div className="invoice-footer">
        <p>Make all checks payable to CreateBox</p>
        <p>If you have any questions, contact: +6285796963601 or createboxpalangkaraya (IG/Email)</p>
        <p className="thank-you">Thank you for your business!</p>
      </div>
    </div>
  );
};

// ===================================================================================
// 2. KOMPONEN UTAMA APLIKASI
// ===================================================================================
function App() {
  const [invoiceCounter, setInvoiceCounter] = useState(() => {
    const savedCounter = localStorage.getItem('invoiceCounter');
    return savedCounter ? parseInt(savedCounter, 10) : 1;
  });

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '0001',
    invoiceDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD (untuk input)
    clientName: '',
    clientCity: '',
    clientPhone: '',
    invoiceFor: '',
    items: [{ description: '', price: '' }],
  });

  useEffect(() => {
    const formattedInvoiceNumber = String(invoiceCounter).padStart(4, '0');
    setInvoiceData(prev => ({ ...prev, invoiceNumber: formattedInvoiceNumber }));
    localStorage.setItem('invoiceCounter', invoiceCounter);
  }, [invoiceCounter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData({ ...invoiceData, [name]: value });
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...invoiceData.items];
    newItems[index][name] = value;
    setInvoiceData({ ...invoiceData, items: newItems });
  };

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

  const handleGeneratePdf = () => {
    const input = document.getElementById('invoice-preview');
    html2canvas(input, { scale: 3, useCORS: true })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`invoice-${invoiceData.invoiceNumber}.pdf`);

       // 🔧 FIX: penanganan nomor invoice lebih aman
      const num = Number(invoiceData.invoiceNumber);
      if (!isNaN(num) && num > 0) {
        setInvoiceCounter(num + 1);
      } else {
        setInvoiceCounter(prev => (isNaN(prev) ? 1 : prev + 1));
      }
    });
  };

  return (
    <div className="App">
      <div className="form-container">
        <h2>Invoice Generator</h2>

        <label>Nomor Invoice</label>
        <input type="text" name="invoiceNumber" value={invoiceData.invoiceNumber} onChange={handleInputChange}/>

        <label>Tanggal Invoice</label>
        <input
          type="date"
          name="invoiceDate"
          value={invoiceData.invoiceDate}
          onChange={handleInputChange}
        />

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

      <div className="preview-container">
        <InvoicePreview data={invoiceData} />
      </div>
    </div>
  );
}

export default App;
