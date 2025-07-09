import React, { useState, useRef, useEffect } from "react";
import styles from "./Dashboard.module.css";

import FileListComponent from "./FileListComponent";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import FilterModal from "./FilterModal";

const Graph = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [kota, setKota] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [kelurahan, setKelurahan] = useState("");
  const [rw, setRw] = useState("");
  const [rt, setRt] = useState("");

  const [files, setFiles] = useState([]);

  const [totalFilesSentToday, setTotalFilesSentToday] = useState(0);
  const [totalFilesSentMonth, setTotalFilesSentMonth] = useState(0);
  const [totalFilesSentOverall, setTotalFilesSentOverall] = useState(0);
  const [officerPerformanceData, setOfficerPerformanceData] = useState([]);

  const fetchFilteredData = async (e) => {
    try {
      const res = await fetch(
        "https://bot.kediritechnopark.com/webhook/psi/filteredData",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kota_pembuatan: e.kota,
            kecamatan: e.kecamatan,
            kelurahan: e.kelurahan,
            rw: e.rw,
            rt: e.rt,
            start_date: e.dateStart,
            end_date: e.dateEnd,
          }),
        }
      );
      const data = await res.json();

      console.log(data);
      const formattedData = data[0].result.grafik.map((item) => ({
        label: item.label,
        count: item.total,
      }));

      setOfficerPerformanceData(formattedData);

      const fileData = data[0].result.data;

      // 1. Set ke state
      setFiles(fileData);

      // 2. Hitung total file hari ini
      const today = new Date().toISOString().slice(0, 10);
      const totalToday = fileData.filter((f) =>
        f.created_at.startsWith(today)
      ).length;
      setTotalFilesSentToday(totalToday);

      // 3. Hitung total bulan ini
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const totalThisMonth = fileData.filter((f) => {
        const d = new Date(f.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;
      setTotalFilesSentMonth(totalThisMonth);

      // 4. Total keseluruhan
      setTotalFilesSentOverall(fileData.length);

      return data;
    } catch (err) {
      console.error("Fetch error:", err);
      return [];
    }
  };

  useEffect(() => {
    fetchFilteredData({ kota: "" });
  }, []);

  return (
    <div>
      <div className={styles.mainContent}>
        <div className={styles.summaryCardsContainer}>
          <div className={styles.summaryCard}>
            <h3>Hari Ini</h3>
            <p>{totalFilesSentToday.toLocaleString()}</p>
          </div>
          <div className={styles.summaryCard}>
            <h3>Bulan Ini</h3>
            <p>{totalFilesSentMonth.toLocaleString()}</p>
          </div>
          <div className={styles.summaryCard}>
            <h3>Total Keseluruhan</h3>
            <p>{totalFilesSentOverall.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className={styles.chartSection}>
        <h2>Grafik Pertumbuhan Anggota</h2>
        <button
          className={styles.filterButton}
          onClick={() => setIsFilterOpen(true)}
        >
          <span className={styles.filterIcon}>🔍</span>
          Filter Data
        </button>
        <FilterModal
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          onApply={(e) => {
            fetchFilteredData(e);
          }}
          kota={kota}
          kecamatan={kecamatan}
          kelurahan={kelurahan}
          rw={rw}
          rt={rt}
          setKota={setKota}
          setKecamatan={setKecamatan}
          setKelurahan={setKelurahan}
          setRw={setRw}
          setRt={setRt}
        />

        {officerPerformanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={officerPerformanceData}
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                dataKey="label"
                type="category"
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="count" fill="#00adef" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.warning}>
            📋 Belum ada data performa untuk ditampilkan
          </div>
        )}
      </div>
      <FileListComponent files={files} />
    </div>
  );
};
export default Graph;
