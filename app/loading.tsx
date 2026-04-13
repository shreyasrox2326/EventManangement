export default function GlobalLoading() {
  return (
    <div className="container" style={{ padding: "48px 0" }}>
      <div className="grid">
        <div className="card panel skeleton" style={{ height: 220 }} />
        <div className="metrics-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card panel skeleton" style={{ height: 160 }} />
          ))}
        </div>
        <div className="card panel skeleton" style={{ height: 400 }} />
      </div>
    </div>
  );
}
