import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const API = 'http://localhost:5000';

export default function App() {
  const [cpu, setCpu]             = useState(null);
  const [memory, setMemory]       = useState(null);
  const [cpuHistory, setCpuHistory] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState('cpu');
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchData = async () => {
    try {
      const cpuRes  = await axios.get(`${API}/api/cpu`);
      const memRes  = await axios.get(`${API}/api/memory`);
      const procRes = await axios.get(`${API}/api/processes`);

      setCpu(cpuRes.data);
      setMemory(memRes.data);
      setProcesses(procRes.data);

      setCpuHistory(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          usage: cpuRes.data.cpu_percent
        };
        return [...prev, newPoint].slice(-20);
      });
    } catch (err) {
      console.error("API Error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Kill a process by PID
  const killProcess = async (pid, name) => {
    if (!window.confirm(`Kill process "${name}" (PID: ${pid})?`)) return;
    try {
      await axios.post(`${API}/api/processes/kill`, { pid });
      alert(`✅ Process ${name} terminated!`);
      fetchData(); // Refresh list
    } catch (err) {
      alert(`❌ Failed: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  // Filter & sort processes based on search and sortBy
  const filteredProcesses = processes
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy])
    .slice(0, 50); // Show top 50 only

  if (!cpu || !memory) {
    return (
      <div style={styles.loading}>
        <h2>⏳ Connecting to SysVision...</h2>
      </div>
    );
  }

  const coreData = cpu.cpu_per_core.map((usage, i) => ({
    core: `C${i}`, usage
  }));

  return (
    <div style={styles.container}>

      {/* ── HEADER ── */}
      <div style={styles.header}>
        <h1 style={styles.title}>⚡ SysVision</h1>
        <p style={styles.subtitle}>Real-Time OS Intelligence Dashboard</p>
      </div>

      {/* ── TABS ── */}
      <div style={styles.tabRow}>
        {['dashboard', 'processes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {})
            }}
          >
            {tab === 'dashboard' ? '📊 Dashboard' : '⚙️ Processes'}
          </button>
        ))}
      </div>

      {/* ══ DASHBOARD TAB ══ */}
      {activeTab === 'dashboard' && (
        <>
          {/* Stat Cards */}
          <div style={styles.cardRow}>
            <StatCard title="CPU Usage"
              value={`${cpu.cpu_percent}%`}
              sub={`${cpu.cpu_count} Cores @ ${cpu.cpu_freq_mhz} MHz`}
              color={cpu.cpu_percent > 80 ? '#ff4444' : '#00d4aa'} />
            <StatCard title="RAM Used"
              value={`${memory.ram_percent}%`}
              sub={`${memory.ram_used_gb} GB / ${memory.ram_total_gb} GB`}
              color={memory.ram_percent > 80 ? '#ff4444' : '#4dabf7'} />
            <StatCard title="Disk Used"
              value={`${memory.disk_percent}%`}
              sub={`${memory.disk_used_gb} GB / ${memory.disk_total_gb} GB`}
              color="#f5a623" />
            <StatCard title="Processes"
              value={processes.length}
              sub="Total running"
              color="#a29bfe" />
          </div>

          {/* Charts */}
          <div style={styles.chartRow}>
            <div style={styles.chartBox}>
              <h3 style={styles.chartTitle}>📈 CPU Usage History</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={cpuHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="time" tick={{ fill: '#aaa', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#aaa', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #00d4aa' }} />
                  <Line type="monotone" dataKey="usage" stroke="#00d4aa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={styles.chartBox}>
              <h3 style={styles.chartTitle}>🔲 Per-Core Usage</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={coreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="core" tick={{ fill: '#aaa', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#aaa', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #4dabf7' }} />
                  <Bar dataKey="usage" fill="#4dabf7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ══ PROCESSES TAB ══ */}
      {activeTab === 'processes' && (
        <div style={styles.processPanel}>

          {/* Controls */}
          <div style={styles.controls}>
            <input
              type="text"
              placeholder="🔍 Search process name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <div style={styles.sortButtons}>
              <span style={styles.sortLabel}>Sort by:</span>
              {['cpu', 'memory'].map(key => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  style={{
                    ...styles.sortBtn,
                    ...(sortBy === key ? styles.sortBtnActive : {})
                  }}
                >
                  {key === 'cpu' ? '⚡ CPU' : '🧠 RAM'}
                </button>
              ))}
            </div>
          </div>

          {/* Process Count */}
          <p style={styles.procCount}>
            Showing {filteredProcesses.length} of {processes.length} processes
          </p>

          {/* Table */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['PID', 'Name', 'CPU %', 'RAM %', 'Status', 'User', 'Action'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProcesses.map((proc, i) => (
                  <tr key={proc.pid}
                    style={{ backgroundColor: i % 2 === 0 ? '#0d0d1a' : '#111128' }}>
                    <td style={styles.td}>{proc.pid}</td>
                    <td style={{ ...styles.td, color: '#00d4aa' }}>{proc.name}</td>
                    <td style={{
                      ...styles.td,
                      color: proc.cpu > 50 ? '#ff4444' : proc.cpu > 20 ? '#f5a623' : '#00d4aa'
                    }}>
                      {proc.cpu}%
                    </td>
                    <td style={{
                      ...styles.td,
                      color: proc.memory > 5 ? '#ff4444' : '#4dabf7'
                    }}>
                      {proc.memory}%
                    </td>
                    <td style={{ ...styles.td, color: '#888' }}>{proc.status}</td>
                    <td style={{ ...styles.td, color: '#888' }}>{proc.username}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => killProcess(proc.pid, proc.name)}
                        style={styles.killBtn}
                      >
                        ✕ Kill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p style={styles.footer}>🔄 Auto-refreshing every 3 seconds</p>
    </div>
  );
}

function StatCard({ title, value, sub, color }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardTitle}>{title}</p>
      <p style={{ ...styles.cardValue, color }}>{value}</p>
      <p style={styles.cardSub}>{sub}</p>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#0d0d1a', minHeight: '100vh', padding: '20px', fontFamily: 'monospace', color: 'white' },
  loading: { backgroundColor: '#0d0d1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4aa' },
  header: { textAlign: 'center', marginBottom: '20px' },
  title: { fontSize: '2.5rem', color: '#00d4aa', margin: 0 },
  subtitle: { color: '#888', marginTop: '5px' },
  tabRow: { display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' },
  tab: { padding: '10px 28px', borderRadius: '8px', border: '1px solid #2a2a4a', backgroundColor: '#1a1a2e', color: '#888', cursor: 'pointer', fontSize: '0.95rem' },
  tabActive: { backgroundColor: '#00d4aa', color: '#0d0d1a', border: '1px solid #00d4aa', fontWeight: 'bold' },
  cardRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' },
  card: { backgroundColor: '#1a1a2e', borderRadius: '12px', padding: '20px', border: '1px solid #2a2a4a', textAlign: 'center' },
  cardTitle: { color: '#888', fontSize: '0.85rem', margin: '0 0 8px 0' },
  cardValue: { fontSize: '2rem', fontWeight: 'bold', margin: '0 0 5px 0' },
  cardSub: { color: '#666', fontSize: '0.75rem', margin: 0 },
  chartRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' },
  chartBox: { backgroundColor: '#1a1a2e', borderRadius: '12px', padding: '20px', border: '1px solid #2a2a4a' },
  chartTitle: { color: '#ccc', fontSize: '0.95rem', marginTop: 0, marginBottom: '15px' },
  processPanel: { backgroundColor: '#1a1a2e', borderRadius: '12px', padding: '20px', border: '1px solid #2a2a4a' },
  controls: { display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' },
  searchInput: { flex: 1, padding: '10px 15px', borderRadius: '8px', border: '1px solid #2a2a4a', backgroundColor: '#0d0d1a', color: 'white', fontSize: '0.9rem', minWidth: '200px' },
  sortButtons: { display: 'flex', gap: '8px', alignItems: 'center' },
  sortLabel: { color: '#888', fontSize: '0.85rem' },
  sortBtn: { padding: '8px 16px', borderRadius: '6px', border: '1px solid #2a2a4a', backgroundColor: '#0d0d1a', color: '#888', cursor: 'pointer' },
  sortBtnActive: { backgroundColor: '#00d4aa', color: '#0d0d1a', fontWeight: 'bold', border: '1px solid #00d4aa' },
  procCount: { color: '#666', fontSize: '0.8rem', marginBottom: '10px' },
  tableWrapper: { overflowX: 'auto', overflowY: 'auto', maxHeight: '450px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: { padding: '12px 10px', textAlign: 'left', color: '#00d4aa', borderBottom: '1px solid #2a2a4a', position: 'sticky', top: 0, backgroundColor: '#1a1a2e' },
  td: { padding: '8px 10px', color: '#ccc', borderBottom: '1px solid #111128' },
  killBtn: { padding: '4px 10px', borderRadius: '4px', border: '1px solid #ff4444', backgroundColor: 'transparent', color: '#ff4444', cursor: 'pointer', fontSize: '0.8rem' },
  footer: { textAlign: 'center', color: '#555', fontSize: '0.8rem', marginTop: '20px' }
};