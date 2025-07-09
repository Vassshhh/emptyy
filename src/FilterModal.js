import React, { useEffect, useState } from "react";
import styles from "./FilterModal.module.css";

const FilterModal = ({
  isOpen,
  onClose,
  onApply,
  kota,
  kecamatan,
  kelurahan,
  rw,
  rt,
  setKota,
  setKecamatan,
  setKelurahan,
  setRw,
  setRt,
}) => {
  const [listKota, setListKota] = useState([]);
  const [listKecamatan, setListKecamatan] = useState([]);
  const [listKelurahan, setListKelurahan] = useState([]);
  const [listRw, setListRw] = useState([]);
  const [listRt, setListRt] = useState([]);

  const fetchOptions = async (body, field) => {
    try {
      const res = await fetch(
        "https://bot.kediritechnopark.com/webhook/psi/filter",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      const unique = [...new Set(data.map((item) => item[field]))];
      return unique;
    } catch (err) {
      console.error("Fetch error:", err);
      return [];
    }
  };

  useEffect(() => {
    if (isOpen) {
      setKota("");
      setKecamatan("");
      setKelurahan("");
      setRw("");
      setRt("");
      setListKecamatan([]);
      setListKelurahan([]);
      setListRw([]);
      setListRt([]);

      fetchOptions(
        { kota_pembuatan: "", kecamatan: "", kel_desa: "", rw: "", rt: "" },
        "kota_pembuatan"
      ).then(setListKota);
    }
  }, [isOpen]);

  const handleKotaChange = (value) => {
    setKota(value);
    setKecamatan("");
    setKelurahan("");
    setRw("");
    setRt("");
    setListKelurahan([]);
    setListRw([]);
    setListRt([]);

    fetchOptions(
      { kota_pembuatan: value, kecamatan: "", kel_desa: "", rw: "", rt: "" },
      "kecamatan"
    ).then(setListKecamatan);
  };

  const handleKecamatanChange = (value) => {
    setKecamatan(value);
    setKelurahan("");
    setRw("");
    setRt("");
    setListRw([]);
    setListRt([]);

    fetchOptions(
      { kota_pembuatan: kota, kecamatan: value, kel_desa: "", rw: "", rt: "" },
      "kel_desa"
    ).then(setListKelurahan);
  };

  const handleKelurahanChange = (value) => {
    setKelurahan(value);
    setRw("");
    setRt("");
    setListRt([]);

    fetchOptions(
      { kota_pembuatan: kota, kecamatan, kel_desa: value, rw: "", rt: "" },
      "rw"
    ).then(setListRw);
  };

  const handleRwChange = (value) => {
    setRw(value);
    setRt("");

    fetchOptions(
      {
        kota_pembuatan: kota,
        kecamatan,
        kel_desa: kelurahan,
        rw: value,
        rt: "",
      },
      "rt"
    ).then(setListRt);
  };

  const handleRtChange = (value) => {
    setRt(value);
  };

  const handleApply = () => {
    onApply({ kota, kecamatan, kelurahan, rw, rt });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Filter Data</h3>

        <select
          className={styles.select}
          value={kota}
          onChange={(e) => handleKotaChange(e.target.value)}
        >
          <option value="">Kota/Kab: Semua</option>
          {listKota &&
            listKota.map((item, idx) => (
              <option key={idx} value={item}>
                {item}
              </option>
            ))}
        </select>

        <select
          className={styles.select}
          value={kecamatan}
          onChange={(e) => handleKecamatanChange(e.target.value)}
          disabled={!kota}
        >
          <option value="">Kecamatan: Semua</option>
          {listKecamatan &&
            listKecamatan.map((item, idx) => (
              <option key={idx} value={item}>
                {item}
              </option>
            ))}
        </select>

        <select
          className={styles.select}
          value={kelurahan}
          onChange={(e) => handleKelurahanChange(e.target.value)}
          disabled={!kecamatan}
        >
          <option value="">Kel/Desa: Semua</option>
          {listKelurahan &&
            listKelurahan.map((item, idx) => (
              <option key={idx} value={item}>
                {item}
              </option>
            ))}
        </select>

        <select
          className={styles.select}
          value={rw}
          onChange={(e) => handleRwChange(e.target.value)}
          disabled={!kelurahan}
        >
          <option value="">RW: Semua</option>
          {listRw &&
            listRw.map((item, idx) => (
              <option key={idx} value={item}>
                {item}
              </option>
            ))}
        </select>

        <select
          className={styles.select}
          value={rt}
          onChange={(e) => handleRtChange(e.target.value)}
          disabled={!rw}
        >
          <option value="">RT: Semua</option>
          {listRt &&
            listRt.map((item, idx) => (
              <option key={idx} value={item}>
                {item}
              </option>
            ))}
        </select>

        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.close}`}
            onClick={onClose}
          >
            Tutup
          </button>
          <button
            className={`${styles.button} ${styles.apply}`}
            onClick={handleApply}
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
