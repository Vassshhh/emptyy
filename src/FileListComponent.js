import React, { useState, useEffect } from "react";
import styles from "./FileListComponent.module.css";
import * as XLSX from "xlsx";
import { PDFDownloadLink } from "@react-pdf/renderer";
import KTPPDF from "./KTPPDF"; // pastikan path sesuai
import html2canvas from "html2canvas";

const FileListComponent = ({ files }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const handleDownloadImage = () => {
    const element = document.getElementById("kta-to-download");
    if (!element) return;

    html2canvas(element, {
      useCORS: true,
      scale: 2,
    }).then((canvas) => {
      const link = document.createElement("a");
      link.download = `KTA_${selectedFile.nik}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const formatPhoneNumber = (phone) =>
    phone?.replace(/(\d{4})(\d{4})(\d{4})/, "$1-$2-$3");

  const handleRowClick = async (file) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Token tidak ditemukan. Silakan login kembali.");
      return;
    }
    document.body.style.overflow = "hidden";

    try {
      const response = await fetch(
        `https://bot.kediritechnopark.com/webhook/6915ea36-e1f4-49ad-a7f1-a27ce0bf2279/ktp/${file.nik}`,
        {
          method: "GET",
          headers: {
            Authorization: token, // atau `Bearer ${token}` jika diperlukan
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Respons kosong dari server.");
      }

      const data = JSON.parse(text);

      if (data.error) {
        alert(data.error);
        return;
      }

      const item = data[0];

      if (!item) {
        alert("Data tidak ditemukan.");
        return;
      }

      // Validasi jika ada image URL
      if (item.foto_url && !item.foto_url.match(/\.(jpg|jpeg|png|webp)$/i)) {
        console.warn(
          "URL foto bukan format gambar yang didukung:",
          item.foto_url
        );
      }

      setSelectedFile(item); // tampilkan di modal misalnya
    } catch (error) {
      console.error("Gagal mengambil detail:", error.message || error);
      alert("Gagal mengambil detail. Pastikan data tersedia.");
    }
  };

  const closeModal = () => {
    setSelectedFile(null);
    document.body.style.overflow = "";
  };

  const exportToExcel = (data) => {
    const domain = window.location.origin;

    const modifiedData = data.map((item) => ({
      ID: item.id,
      Petugas_ID: item.petugas_id,
      Petugas: item.username,
      NIK: item.nik,
      Nama_Lengkap: item.nama_lengkap,
      Tempat_Lahir: item.tempat_lahir,
      Tanggal_Lahir: new Date(item.tanggal_lahir),
      Jenis_Kelamin: item.jenis_kelamin,
      Alamat: item.alamat,
      RT_RW: item.rt_rw,
      Kel_Desa: item.kel_desa,
      Kecamatan: item.kecamatan,
      Agama: item.agama,
      Status_Perkawinan: item.status_perkawinan,
      Pekerjaan: item.pekerjaan,
      Kewarganegaraan: item.kewarganegaraan,
      No_HP: item.no_hp,
      Email: item.email,
      Berlaku_Hingga: new Date(item.berlaku_hingga),
      Pembuatan: new Date(item.pembuatan),
      Kota_Pembuatan: item.kota_pembuatan,
      Created_At: new Date(item.created_at),
      ImageURL: `${domain}/${item.nik}`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(modifiedData);

    // Add hyperlink to ImageURL column (last column)
    modifiedData.forEach((item, index) => {
      const cellAddress = `W${index + 2}`; // Column W (ImageURL), starts at row 2
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].l = {
          Target: item.ImageURL,
          Tooltip: "Lihat Gambar",
        };
      }
    });

    // Optional: Auto column widths (you can fine-tune)
    worksheet["!cols"] = new Array(Object.keys(modifiedData[0]).length).fill({
      wch: 20,
    });

    // Add autofilter
    worksheet["!autofilter"] = { ref: `A1:W1` }; // Covers all columns (A to W)

    // Export
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "data-export.xlsx");
  };

  if (!files) {
    return (
      <div className={styles.fileListSection}>
        <div className={styles.emptyState}>
          <div className={styles.spinner}></div>
          <div className={styles.emptyStateTitle}>Memuat file...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fileListSection}>
      <div className={styles.fileListHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h2 className={styles.fileListTitle}>📁 Daftar Anggota</h2>

          <span className={styles.fileCount}>{files.length} anggota</span>

          <button
            onClick={() => {
              exportToExcel(files);
            }}
            className={styles.downloadButton}
          >
            ⬇️ Unduh
          </button>
        </div>
      </div>

      {successMessage && (
        <div className={styles.successMessage}>
          <span>✅</span>
          {successMessage}
        </div>
      )}

      <div className={styles.tableContainer}>
        {files && files.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateTitle}>Belum ada data</div>
            <p className={styles.emptyStateText}>
              Tidak ada data KTP yang tersedia saat ini.
            </p>
          </div>
        ) : (
          <table className={styles.fileTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>NIK</th>
                <th className={styles.nameColumn}>Nama Lengkap</th>
                <th>No. HP</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, index) => (
                <tr
                  key={file.id}
                  onClick={() => handleRowClick(file)}
                  className={styles.tableRow}
                >
                  <td>{index + 1}</td>
                  <td>{file.nik}</td>
                  <td className={styles.nameColumn}>{file.nama_lengkap}</td>
                  <td>{formatPhoneNumber(file.no_hp)}</td>
                  <td>{file.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Detail */}
      {selectedFile && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.ktaWrapper}>
              <div className={styles.ktaContainer} id="kta-to-download">
                <img
                  src={"/background-kta.jpg"}
                  alt="KTA"
                  className={styles.ktaImage}
                />
                <h2 className={`${styles.h2Text} ${styles.nama}`}>
                  {selectedFile.nama_lengkap}
                </h2>
                <h2 className={`${styles.h2Text} ${styles.nik}`}>
                  {selectedFile.nik}
                </h2>
              </div>
            </div>
            {/* Foto KTP */}
            {/* {selectedFile.data && (
              <img
                src={`data:image/jpeg;base64,${selectedFile.data}`}
                alt={`Foto KTP - ${selectedFile.nik}`}
                style={{
                  width: "100%",
                  maxHeight: "300px",
                  objectFit: "contain",
                  marginBottom: "1rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              />
            )} */}
            <div
              onClick={handleDownloadImage}
              style={{
                textDecoration: "none",
                padding: "8px 16px",
                color: "#fff",
                backgroundColor: "#10b981",
                borderRadius: "6px",
                display: "inline-block",
                margin: "1rem 1rem",
                cursor: "pointer",
              }}
            >
              ⬇️ Unduh KTA
            </div>

            <PDFDownloadLink
              document={
                <KTPPDF
                  data={{
                    ...selectedFile,
                    data:
                      selectedFile.data?.startsWith("/") ||
                      selectedFile.data?.length < 50
                        ? null // invalid base64
                        : selectedFile.data.replace(/\s/g, ""),
                    fallbackImage: selectedFile.foto_url, // digunakan kalau data base64 gagal
                  }}
                />
              }
              fileName={`KTP_${selectedFile.nik}.pdf`}
              style={{
                textDecoration: "none",
                padding: "8px 16px",
                color: "#fff",
                backgroundColor: "#10b981",
                borderRadius: "6px",
                display: "inline-block",
                margin: "1rem 1rem",
              }}
            >
              {({ loading }) =>
                loading ? "Menyiapkan PDF..." : "⬇️ Unduh PDF"
              }
            </PDFDownloadLink>
            <h3>🪪 Detail Data Anggota</h3>
            <table className={styles.detailTable}>
              <tbody>
                <tr>
                  <td>NIK</td>
                  <td>{selectedFile.nik}</td>
                </tr>
                <tr>
                  <td>Nama Lengkap</td>
                  <td>{selectedFile.nama_lengkap}</td>
                </tr>
                <tr>
                  <td>Tempat Lahir</td>
                  <td>{selectedFile.tempat_lahir}</td>
                </tr>
                <tr>
                  <td>Tanggal Lahir</td>
                  <td>{selectedFile.tanggal_lahir}</td>
                </tr>
                <tr>
                  <td>Jenis Kelamin</td>
                  <td>{selectedFile.jenis_kelamin}</td>
                </tr>
                <tr>
                  <td>Alamat</td>
                  <td>{selectedFile.alamat}</td>
                </tr>
                <tr>
                  <td>RT/RW</td>
                  <td>{selectedFile.rt_rw}</td>
                </tr>
                <tr>
                  <td>Kelurahan/Desa</td>
                  <td>{selectedFile.kel_desa}</td>
                </tr>
                <tr>
                  <td>Kecamatan</td>
                  <td>{selectedFile.kecamatan}</td>
                </tr>
                <tr>
                  <td>Agama</td>
                  <td>{selectedFile.agama}</td>
                </tr>
                <tr>
                  <td>Status Perkawinan</td>
                  <td>{selectedFile.status_perkawinan}</td>
                </tr>
                <tr>
                  <td>Pekerjaan</td>
                  <td>{selectedFile.pekerjaan}</td>
                </tr>
                <tr>
                  <td>Kewarganegaraan</td>
                  <td>{selectedFile.kewarganegaraan}</td>
                </tr>
                <tr>
                  <td>No HP</td>
                  <td>{selectedFile.no_hp}</td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td>{selectedFile.email}</td>
                </tr>
                <tr>
                  <td>Berlaku Hingga</td>
                  <td>{selectedFile.berlaku_hingga}</td>
                </tr>
                <tr>
                  <td>Tanggal Pembuatan</td>
                  <td>{selectedFile.pembuatan}</td>
                </tr>
                <tr>
                  <td>Kota Pembuatan</td>
                  <td>{selectedFile.kota_pembuatan}</td>
                </tr>
              </tbody>
            </table>
            <button className={styles.closeButton} onClick={closeModal}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileListComponent;
