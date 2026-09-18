function StatCard({ title, value, change, type = "positive" }) {
  return (
    <div className="stat-card">

      <p>{title}</p>

      <h2>{value}</h2>

      <span className={type}>
        {change}
      </span>

      <small>vs yesterday</small>

    </div>
  );
}

export default StatCard;