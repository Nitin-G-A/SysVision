import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const API = 'http://localhost:5000';

export default function App() {
  const [cpu, setCpu]               = useState(null);
  const [memory, setMemory]         = useState(null);
  const [cpuHistory, setCpuHistory] = useState([]);
  const [processes, setProcesses]   = useState([]);
  const [search, setSearch]         = useState('');
  const [sortBy, setSortBy]         = useState('cpu');
  const [activeTab, setActiveTab]   = useState('dashboard');

  // Vault states
  const [vaultFile, setVaultFile]     = useState(null);
  const [vaultStatus, setVaultStatus] = useState('');
  const [vaultLoading, setVaultLoading] = useState(false);

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

  // ── VAULT FUNCTIONS ──
  const handleEncrypt = async () => {
    if (!vaultFile) return setVaultStatus('⚠️ Please select a file first!');
    setVaultLoading(true);
    setVaultStatus('🔐 Encrypting...');
    try {
      // FormData is used to send files via HTTP
      const formData = new FormData();
      formData.append('file', vaultFile);  // attach file

      // axios.post with responseType:'blob' to receive file download
      const response = await axios.post(
        `${API}/api/vault/encrypt`,
        formData,
        { responseType: 'blob' }  // blob = binary large object (file)
      );

      // Create a download link programmatically
      downloadBlob(response.data, vaultFile.name + '.vault');
      setVaultStatus('✅ File encrypted & downloaded as .vault!');
    } catch (err) {
      setVaultStatus('❌ Encryption failed!');
    }
    setVaultLoading(false);
  };

  const handleDecrypt = async () => {
    if (!vaultFile) return setVaultStatus('⚠️ Please select a .vault file!');
    if (!vaultFile.name.endsWith('.vault')) {
      return setVaultStatus('⚠️ Please select a .vault file to decrypt!');
    }
    setVaultLoading(true);
    setVaultStatus('🔓 Decrypting...');
    try {
      const formData = new FormData();
      formData.append('file', vaultFile);
      const response = await axios.post(
        `${API}/api/vault/decrypt`,
        formData,
        { responseType: 'blob' }
      );
      const originalName = vaultFile.name.replace('.vault', '');
      downloadBlob(response.data, originalName);
      setVaultStatus('✅ File decrypted & downloaded!');
    } catch (err) {
      setVaultStatus('❌ Decryption failed — wrong key or bad file!');
    }
    setVaultLoading(false);
  };

  // Helper: triggers browser file download from blob data
  const downloadBlob = (data, filename) => {
    const url    = window.URL.createObjectURL(new Blob([data]));
    const link   = document.createElement('a');
    link.href    = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const killProcess = async (pid, name) => {
    if (!window.confirm(`Kill process "${name}" (PID: ${pid})?`)) return;
    try {
      await axios.post(`${API}/api/processes/kill`, { pid });
      alert(`✅ Process ${name} terminated!`);
      fetchData();
    } catch (err) {
      alert(`❌ Failed: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  const filteredProcesses = processes
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy])
    .slice(0, 50);

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

  const tabs = ['dashboard', 'processes', 'vault'];

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>⚡ SysVision</h1>
        <p style={styles.subtitle}>Real-Time OS Intelligence Dashboard</p>
      </div>

      {/* TABS */}
      <div style={styles.tabRow}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}>
            {tab === 'dashboard' ? '📊 Dashboard'
             : tab === 'processes' ? '⚙️ Processes'
             : '🔐 File Vault'}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <>
          <div style={styles.cardRow}>
            <StatCard title="CPU Usage" value={`${cpu.cpu_percent}%`}
              sub={`${cpu.cpu_count} Cores @ ${cpu.cpu_freq_mhz} MHz`}
              color={cpu.cpu_percent > 80 ? '#ff4444' : '#00d4aa'} />
            <StatCard title="RAM Used" value={`${memory.ram_percent}%`}
              sub={`${memory.ram_used_gb} GB / ${memory.ram_total_gb} GB`}
              color={memory.ram_percent > 80 ? '#ff4444' : '#4dabf7'} />
            <StatCard title="Disk Used" value={`${memory.disk_percent}%`}
              sub={`${memory.disk_used_gb} GB / ${memory.disk_total_gb} GB`}
              color="#f5a623" />
            <StatCard title="Processes" value={processes.length}
              sub="Total running" color="#a29bfe" />
          </div>
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

      {/* PROCESSES TAB */}
      {activeTab === 'processes' && (
        <div style={styles.processPanel}>
          <div style={styles.controls}>
            <input type="text" placeholder="🔍 Search process name..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={styles.searchInput} />
            <div style={styles.sortButtons}>
              <span style={styles.sortLabel}>Sort by:</span>
              {['cpu', 'memory'].map(key => (
                <button key={key} onClick={() => setSortBy(key)}
                  style={{ ...styles.sortBtn, ...(sortBy === key ? styles.sortBtnActive : {}) }}>
                  {key === 'cpu' ? '⚡ CPU' : '🧠 RAM'}
                </button>
              ))}
            </div>
          </div>
          <p style={styles.procCount}>
            Showing {filteredProcesses.length} of {processes.length} processes
          </p>
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
                    <td style={{ ...styles.td, color: proc.cpu > 50 ? '#ff4444' : proc.cpu > 20 ? '#f5a623' : '#00d4aa' }}>
                      {proc.cpu}%</td>
                    <td style={{ ...styles.td, color: proc.memory > 5 ? '#ff4444' : '#4dabf7' }}>
                      {proc.memory}%</td>
                    <td style={{ ...styles.td, color: '#888' }}>{proc.status}</td>
                    <td style={{ ...styles.td, color: '#888' }}>{proc.username}</td>
                    <td style={styles.td}>
                      <button onClick={() => killProcess(proc.pid, proc.name)}
                        style={styles.killBtn}>✕ Kill</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VAULT TAB */}
      {activeTab === 'vault' && (
        <div style={styles.vaultPanel}>

          <div style={styles.vaultHeader}>
            <h2 style={styles.vaultTitle}>🔐 File Vault</h2>
            <p style={styles.vaultSubtitle}>
              Encrypt any file with AES-256 military-grade encryption
            </p>
          </div>

          {/* Info Cards */}
          <div style={styles.vaultInfoRow}>
            <div style={styles.vaultInfoCard}>
              <p style={styles.vaultInfoIcon}>🛡️</p>
              <p style={styles.vaultInfoTitle}>AES-256</p>
              <p style={styles.vaultInfoText}>Military-grade encryption standard</p>
            </div>
            <div style={styles.vaultInfoCard}>
              <p style={styles.vaultInfoIcon}>🔑</p>
              <p style={styles.vaultInfoTitle}>Auto Key</p>
              <p style={styles.vaultInfoText}>Key auto-generated and stored securely</p>
            </div>
            <div style={styles.vaultInfoCard}>
              <p style={styles.vaultInfoIcon}>📁</p>
              <p style={styles.vaultInfoTitle}>Any File</p>
              <p style={styles.vaultInfoText}>Encrypt PDFs, images, docs, any format</p>
            </div>
          </div>

          {/* File Upload Zone */}
          <div style={styles.uploadZone}>
            <p style={styles.uploadIcon}>📂</p>
            <p style={styles.uploadText}>Select any file to encrypt or decrypt</p>
            <input
              type="file"
              onChange={e => {
                setVaultFile(e.target.files[0]);
                setVaultStatus('');
              }}
              style={styles.fileInput}
            />
            {vaultFile && (
              <p style={styles.selectedFile}>
                Selected: <span style={{ color: '#00d4aa' }}>{vaultFile.name}</span>
                {' '}({(vaultFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div style={styles.vaultBtnRow}>
            <button
              onClick={handleEncrypt}
              disabled={vaultLoading}
              style={styles.encryptBtn}>
              {vaultLoading ? '⏳ Processing...' : '🔐 Encrypt File'}
            </button>
            <button
              onClick={handleDecrypt}
              disabled={vaultLoading}
              style={styles.decryptBtn}>
              {vaultLoading ? '⏳ Processing...' : '🔓 Decrypt .vault File'}
            </button>
          </div>

          {/* Status Message */}
          {vaultStatus && (
            <div style={styles.vaultStatus}>
              {vaultStatus}
            </div>
          )}

          {/* How it works */}
          <div style={styles.howItWorks}>
            <h3 style={{ color: '#4dabf7', marginTop: 0 }}>How it works:</h3>
            <p style={{ color: '#888', fontSize: '0.85rem', margin: '5px 0' }}>
              1. Select any file (PDF, image, document, etc.)
            </p>
            <p style={{ color: '#888', fontSize: '0.85rem', margin: '5px 0' }}>
              2. Click Encrypt → downloads a .vault file (unreadable)
            </p>
            <p style={{ color: '#888', fontSize: '0.85rem', margin: '5px 0' }}>
              3. To get original back → select .vault file → click Decrypt
            </p>
            <p style={{ color: '#555', fontSize: '0.8rem', marginTop: '10px' }}>
              ⚠️ Keep the secret.key file safe — without it, decryption is impossible!
            </p>
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
  vaultPanel: { backgroundColor: '#1a1a2e', borderRadius: '12px', padding: '30px', border: '1px solid #2a2a4a', maxWidth: '700px', margin: '0 auto' },
  vaultHeader: { textAlign: 'center', marginBottom: '25px' },
  vaultTitle: { color: '#00d4aa', fontSize: '1.8rem', margin: 0 },
  vaultSubtitle: { color: '#888', fontSize: '0.9rem', marginTop: '8px' },
  vaultInfoRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '25px' },
  vaultInfoCard: { backgroundColor: '#0d0d1a', borderRadius: '10px', padding: '15px', textAlign: 'center', border: '1px solid #2a2a4a' },
  vaultInfoIcon: { fontSize: '1.8rem', margin: '0 0 8px 0' },
  vaultInfoTitle: { color: '#00d4aa', fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '0.9rem' },
  vaultInfoText: { color: '#666', fontSize: '0.78rem', margin: 0 },
  uploadZone: { border: '2px dashed #2a2a4a', borderRadius: '12px', padding: '30px', textAlign: 'center', marginBottom: '20px', backgroundColor: '#0d0d1a' },
  uploadIcon: { fontSize: '2.5rem', margin: '0 0 10px 0' },
  uploadText: { color: '#888', marginBottom: '15px', fontSize: '0.9rem' },
  fileInput: { color: '#ccc', fontSize: '0.85rem', cursor: 'pointer' },
  selectedFile: { marginTop: '12px', color: '#888', fontSize: '0.85rem' },
  vaultBtnRow: { display: 'flex', gap: '12px', marginBottom: '20px' },
  encryptBtn: { flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#00d4aa', color: '#0d0d1a', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' },
  decryptBtn: { flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #4dabf7', backgroundColor: 'transparent', color: '#4dabf7', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' },
  vaultStatus: { padding: '14px', borderRadius: '8px', backgroundColor: '#0d0d1a', border: '1px solid #2a2a4a', textAlign: 'center', marginBottom: '20px', color: '#ccc', fontSize: '0.95rem' },
  howItWorks: { backgroundColor: '#0d0d1a', borderRadius: '10px', padding: '20px', border: '1px solid #1a1a3a' },
  footer: { textAlign: 'center', color: '#555', fontSize: '0.8rem', marginTop: '20px' }
};