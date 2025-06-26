import React from "react";
import styles from "./RoleCard.module.css";

const RoleCard = ({ title, value, code }) => {
  return (
    <div className={styles.card}>
      <div className={styles.title}>{title}</div>
      <div className={styles.value}>{value}</div>
      {code && <div className={styles.code}>{code}</div>}
    </div>
  );
};

export default RoleCard;
