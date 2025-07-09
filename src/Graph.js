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

  const [totalFilesSentToday, setTotalFilesSentToday] = useState(0);
  const [totalFilesSentMonth, setTotalFilesSentMonth] = useState(0);
  const [totalFilesSentOverall, setTotalFilesSentOverall] = useState(0);
  const [officerPerformanceData, setOfficerPerformanceData] = useState([]);

  const fetchFilteredData = async (body, field) => {
    try {
      const res = await fetch(
        "https://bot.kediritechnopark.com/webhook/psi/filteredData",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();

      console.log(data);
      return data;
    } catch (err) {
      console.error("Fetch error:", err);
      return [];
    }
  };

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
        <button onClick={() => setIsFilterOpen(true)}></button>
        <FilterModal
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          onApply={() => {}}
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
              margin={{ top: 5, right: 20, left: -30, bottom: 5 }}
            >
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                dataKey="month"
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
      <FileListComponent
        setTotalFilesSentToday={setTotalFilesSentToday}
        setTotalFilesSentMonth={setTotalFilesSentMonth}
        setTotalFilesSentOverall={setTotalFilesSentOverall}
        setOfficerPerformanceData={setOfficerPerformanceData}
      />
    </div>
  );
};
export default Graph;
