import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

// Base URL of our Flask backend
const API = 'http://localhost:5000';

export default function App() {
  // useState stores data that changes over time
  const [cpu, setCpu] = useState(null);
  const [memory, setMemory] = useState(null);

  // cpuHistory stores last 20 readings for the line chart
  const [cpuHistory, setCpuHistory] = useState([]);

  // fetchData calls both APIs and updates state
  const fetchData = async () => {
    try {
      const cpuRes = await axios.get(`${API}/api/cpu`);
      const memRes = await axios.get(`${API}/api/memory`);

      setCpu(cpuRes.data);
      setMemory(memRes.data);

      // Add new CPU reading to history (keep last 20)
      setCpuHistory(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          usage: cpuRes.data.cpu_percent
        };
        const updated = [...prev, newPoint];
        return updated.slice(-20); // keep only last 20
      });

    } catch (err) {
      console.error("API Error:", err);
    }
  };

  // useEffect runs fetchData every 2 seconds automatically
  useEffect(() => {
    fetchData(); // run immediately on load
    const interval = setInterval(fetchData, 2000); // then every 2s
    return () => clearInterval(interval); // cleanup on exit
  }, []);

  // Show loading screen until data arrives
  if (!cpu || !memory) {
    return (
      <div style={styles.loading}>
        <h2>⏳ Connecting to SysVision...</h2>
      </div>
    );
  }

  // Per-core data formatted for BarChart
  const coreData = cpu.cpu_per_core.map((usage, i) => ({
    core: `C${i}`,
    usage: usage
  }));

  return (
    <div style={styles.container}>

      {/* ── HEADER ── */}
      <div style={styles.header}>
        <h1 style={styles.title}>⚡ SysVision</h1>
        <p style={styles.subtitle}>Real-Time OS Intelligence Dashboard</p>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={styles.cardRow}>
        <StatCard
          title="CPU Usage"
          value={`${cpu.cpu_percent}%`}
          sub={`${cpu.cpu_count} Cores @ ${cpu.cpu_freq_mhz} MHz`}
          color={cpu.cpu_percent > 80 ? '#ff4444' : '#00d4aa'}
        />
        <StatCard
          title="RAM Used"
          value={`${memory.ram_percent}%`}
          sub={`${memory.ram_used_gb} GB / ${memory.ram_total_gb} GB`}
          color={memory.ram_percent > 80 ? '#ff4444' : '#4dabf7'}
        />
        <StatCard
          title="Disk Used"
          value={`${memory.disk_percent}%`}
          sub={`${memory.disk_used_gb} GB / ${memory.disk_total_gb} GB`}
          color="#f5a623"
        />
        <StatCard
          title="Disk Free"
          value={`${memory.disk_free_gb} GB`}
          sub="Available storage"
          color="#a29bfe"
        />
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={styles.chartRow}>

        {/* CPU History Line Chart */}
        <div style={styles.chartBox}>
          <h3 style={styles.chartTitle}>📈 CPU Usage History</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cpuHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" tick={{ fill: '#aaa', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#aaa', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #00d4aa' }}
              />
              <Line
                type="monotone"
                dataKey="usage"
                stroke="#00d4aa"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Per-Core Bar Chart */}
        <div style={styles.chartBox}>
          <h3 style={styles.chartTitle}>🔲 Per-Core Usage</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={coreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="core" tick={{ fill: '#aaa', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#aaa', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #4dabf7' }}
              />
              <Bar dataKey="usage" fill="#4dabf7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ── FOOTER ── */}
      <p style={styles.footer}>🔄 Auto-refreshing every 2 seconds</p>
    </div>
  );
}

// ── Reusable Stat Card Component ──
function StatCard({ title, value, sub, color }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardTitle}>{title}</p>
      <p style={{ ...styles.cardValue, color }}>{value}</p>
      <p style={styles.cardSub}>{sub}</p>
    </div>
  );
}

// ── All Styles ──
const styles = {
  container: {
    backgroundColor: '#0d0d1a',
    minHeight: '100vh',
    padding: '20px',
    fontFamily: 'monospace',
    color: 'white'
  },
  loading: {
    backgroundColor: '#0d0d1a',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00d4aa'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '2.5rem',
    color: '#00d4aa',
    margin: 0
  },
  subtitle: {
    color: '#888',
    marginTop: '5px'
  },
  cardRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '15px',
    marginBottom: '25px'
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #2a2a4a',
    textAlign: 'center'
  },
  cardTitle: {
    color: '#888',
    fontSize: '0.85rem',
    margin: '0 0 8px 0'
  },
  cardValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '0 0 5px 0'
  },
  cardSub: {
    color: '#666',
    fontSize: '0.75rem',
    margin: 0
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '20px'
  },
  chartBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #2a2a4a'
  },
  chartTitle: {
    color: '#ccc',
    fontSize: '0.95rem',
    marginTop: 0,
    marginBottom: '15px'
  },
  footer: {
    textAlign: 'center',
    color: '#555',
    fontSize: '0.8rem'
  }
};