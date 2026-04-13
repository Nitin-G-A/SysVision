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
  const [vaultFile, setVaultFile]       = useState(null);
  const [vaultStatus, setVaultStatus]   = useState('');
  const [vaultLoading, setVaultLoading] = useState(false);

  // Task states
  const [tasks, setTasks]         = useState([]);
  const [taskForm, setTaskForm]   = useState({
    title: '', description: '', priority: 2, due_date: ''
  });
  const [taskMsg, setTaskMsg]     = useState('');

  const fetchData = async () => {
    try {
      const cpuRes  = await axios.get(`${API}/api/cpu`);
      const memRes  = await axios.get(`${API}/api/memory`);
      const procRes = await axios.get(`${API}/api/processes`);
      setCpu(cpuRes.data);
      setMemory(memRes.data);
      setProcesses(procRes.data);
      setCpuHistory(prev => {
        const pt = { time: new Date().toLocaleTimeString(), usage: cpuRes.data.cpu_percent };
        return [...prev, pt].slice(-20);
      });
    } catch (err) { console.error(err); }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/api/tasks`);
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
    fetchTasks();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── TASK FUNCTIONS ──
  const createTask = async () => {
    if (!taskForm.title.trim()) return setTaskMsg('⚠️ Title is required!');
    try {
      await axios.post(`${API}/api/tasks`, taskForm);
      setTaskMsg('✅ Task created!');
      setTaskForm({ title: '', description: '', priority: 2, due_date: '' });
      fetchTasks();
      setTimeout(() => setTaskMsg(''), 2000);
    } catch (err) { setTaskMsg('❌ Failed to create task'); }
  };

  const toggleTask = async (id, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await axios.put(`${API}/api/tasks/${id}`, { status: newStatus });
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await axios.delete(`${API}/api/tasks/${id}`);
    fetchTasks();
  };

  // ── VAULT FUNCTIONS ──
  const handleEncrypt = async () => {
    if (!vaultFile) return setVaultStatus('⚠️ Select a file first!');
    setVaultLoading(true); setVaultStatus('🔐 Encrypting...');
    try {
      const fd = new FormData(); fd.append('file', vaultFile);
      const res = await axios.post(`${API}/api/vault/encrypt`, fd, { responseType: 'blob' });
      downloadBlob(res.data, vaultFile.name + '.vault');
      setVaultStatus('✅ Encrypted & downloaded!');
    } catch { setVaultStatus('❌ Encryption failed!'); }
    setVaultLoading(false);
  };

  const handleDecrypt = async () => {
    if (!vaultFile) return setVaultStatus('⚠️ Select a .vault file!');
    if (!vaultFile.name.endsWith('.vault')) return setVaultStatus('⚠️ Select a .vault file!');
    setVaultLoading(true); setVaultStatus('🔓 Decrypting...');
    try {
      const fd = new FormData(); fd.append('file', vaultFile);
      const res = await axios.post(`${API}/api/vault/decrypt`, fd, { responseType: 'blob' });
      downloadBlob(res.data, vaultFile.name.replace('.vault', ''));
      setVaultStatus('✅ Decrypted & downloaded!');
    } catch { setVaultStatus('❌ Decryption failed!'); }
    setVaultLoading(false);
  };

  const downloadBlob = (data, filename) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url; a.setAttribute('download', filename);
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  };

  const killProcess = async (pid, name) => {
    if (!window.confirm(`Kill "${name}" (PID: ${pid})?`)) return;
    try {
      await axios.post(`${API}/api/processes/kill`, { pid });
      fetchData();
    } catch (err) { alert(`❌ ${err.response?.data?.error}`); }
  };

  const filteredProcesses = processes
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy])
    .slice(0, 50);

  const priorityLabel = { 1: 'HIGH', 2: 'MEDIUM', 3: 'LOW' };
  const priorityColor = { 1: '#ff4444', 2: '#f5a623', 3: '#00d4aa' };

  if (!cpu || !memory) return (
    <div style={styles.loading}><h2>⏳ Connecting...</h2></div>
  );

  const coreData = cpu.cpu_per_core.map((u, i) => ({ core: `C${i}`, usage: u }));
  const tabs = ['dashboard', 'processes', 'vault', 'tasks'];

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>SYS VISION</h1>
        <p style={styles.subtitle}>Real-Time Intelligence Dashboard</p>
      </div>

      {/* TABS */}
      <div style={styles.tabRow}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}>
            {tab === 'dashboard' ? 'Dashboard'
             : tab === 'processes' ? 'Processes'
             : tab === 'vault' ? 'File Vault'
             : 'Tasks'}
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
            <StatCard title="Tasks" value={tasks.length}
              sub={`${tasks.filter(t => t.status === 'pending').length} pending`}
              color="#a29bfe" />
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
            <input type="text" placeholder="🔍 Search process..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={styles.searchInput} />
            <div style={styles.sortButtons}>
              <span style={styles.sortLabel}>Sort by:</span>
              {['cpu', 'memory'].map(key => (
                <button key={key} onClick={() => setSortBy(key)}
                  style={{ ...styles.sortBtn, ...(sortBy === key ? styles.sortBtnActive : {}) }}>
                  {key === 'cpu' ? 'CPU' : 'RAM'}
                </button>
              ))}
            </div>
          </div>
          <p style={styles.procCount}>Showing {filteredProcesses.length} of {processes.length} processes</p>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead><tr>
                {['PID','Name','CPU %','RAM %','Status','User','Action'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filteredProcesses.map((p, i) => (
                  <tr key={p.pid} style={{ backgroundColor: i%2===0?'#0d0d1a':'#111128' }}>
                    <td style={styles.td}>{p.pid}</td>
                    <td style={{...styles.td,color:'#00d4aa'}}>{p.name}</td>
                    <td style={{...styles.td,color:p.cpu>50?'#ff4444':p.cpu>20?'#f5a623':'#00d4aa'}}>{p.cpu}%</td>
                    <td style={{...styles.td,color:p.memory>5?'#ff4444':'#4dabf7'}}>{p.memory}%</td>
                    <td style={{...styles.td,color:'#888'}}>{p.status}</td>
                    <td style={{...styles.td,color:'#888'}}>{p.username}</td>
                    <td style={styles.td}>
                      <button onClick={() => killProcess(p.pid, p.name)} style={styles.killBtn}>✕ Kill</button>
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
            <h2 style={styles.vaultTitle}>File Vault</h2>
            <p style={styles.vaultSubtitle}>AES-256 military-grade encryption</p>
          </div>
          <div style={styles.vaultInfoRow}>
            {[['🛡️','AES-256','Military-grade standard'],['🔑','Auto Key','Stored securely'],['📁','Any File','PDF, images, docs']].map(([icon,title,text]) => (
              <div key={title} style={styles.vaultInfoCard}>
                <p style={styles.vaultInfoIcon}>{icon}</p>
                <p style={styles.vaultInfoTitle}>{title}</p>
                <p style={styles.vaultInfoText}>{text}</p>
              </div>
            ))}
          </div>
          <div style={styles.uploadZone}>
            <p style={styles.uploadIcon}>📂</p>
            <p style={styles.uploadText}>Select any file to encrypt or decrypt</p>
            <input type="file" onChange={e => { setVaultFile(e.target.files[0]); setVaultStatus(''); }} style={styles.fileInput} />
            {vaultFile && <p style={styles.selectedFile}>Selected: <span style={{color:'#00d4aa'}}>{vaultFile.name}</span> ({(vaultFile.size/1024).toFixed(1)} KB)</p>}
          </div>
          <div style={styles.vaultBtnRow}>
            <button onClick={handleEncrypt} disabled={vaultLoading} style={styles.encryptBtn}>
              {vaultLoading ? 'Processing...' : 'Encrypt File'}
            </button>
            <button onClick={handleDecrypt} disabled={vaultLoading} style={styles.decryptBtn}>
              {vaultLoading ? 'Processing...' : 'Decrypt .vault File'}
            </button>
          </div>
          {vaultStatus && <div style={styles.vaultStatus}>{vaultStatus}</div>}
        </div>
      )}

      {/* TASKS TAB */}
      {activeTab === 'tasks' && (
        <div style={styles.taskPanel}>
          <h2 style={styles.taskTitle}>Task Scheduler</h2>
          <p style={styles.taskSubtitle}>Priority Queue — HIGH priority tasks appear first</p>

          {/* Add Task Form */}
          <div style={styles.taskForm}>
            <h3 style={styles.formTitle}>Add New Task</h3>
            <input
              placeholder="Task title (required)"
              value={taskForm.title}
              onChange={e => setTaskForm({...taskForm, title: e.target.value})}
              style={styles.taskInput}
            />
            <input
              placeholder="Description (optional)"
              value={taskForm.description}
              onChange={e => setTaskForm({...taskForm, description: e.target.value})}
              style={styles.taskInput}
            />
            <div style={styles.taskFormRow}>
              <select
                value={taskForm.priority}
                onChange={e => setTaskForm({...taskForm, priority: parseInt(e.target.value)})}
                style={styles.taskSelect}
              >
                <option value={1}>🔴 HIGH Priority</option>
                <option value={2}>🟠 MEDIUM Priority</option>
                <option value={3}>🟢 LOW Priority</option>
              </select>
              <input
                type="date"
                value={taskForm.due_date}
                onChange={e => setTaskForm({...taskForm, due_date: e.target.value})}
                style={styles.taskInput}
              />
            </div>
            <button onClick={createTask} style={styles.addTaskBtn}>
              ➕ Add Task
            </button>
            {taskMsg && <p style={styles.taskMsg}>{taskMsg}</p>}
          </div>

          {/* Task Stats */}
          <div style={styles.taskStats}>
            <div style={styles.taskStatCard}>
              <p style={{color:'#888',margin:0,fontSize:'0.8rem'}}>Total</p>
              <p style={{color:'#fff',margin:0,fontSize:'1.5rem',fontWeight:'bold'}}>{tasks.length}</p>
            </div>
            <div style={styles.taskStatCard}>
              <p style={{color:'#888',margin:0,fontSize:'0.8rem'}}>Pending</p>
              <p style={{color:'#f5a623',margin:0,fontSize:'1.5rem',fontWeight:'bold'}}>
                {tasks.filter(t => t.status === 'pending').length}
              </p>
            </div>
            <div style={styles.taskStatCard}>
              <p style={{color:'#888',margin:0,fontSize:'0.8rem'}}>Completed</p>
              <p style={{color:'#00d4aa',margin:0,fontSize:'1.5rem',fontWeight:'bold'}}>
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <div style={styles.taskStatCard}>
              <p style={{color:'#888',margin:0,fontSize:'0.8rem'}}>HIGH Priority</p>
              <p style={{color:'#ff4444',margin:0,fontSize:'1.5rem',fontWeight:'bold'}}>
                {tasks.filter(t => t.priority === 1).length}
              </p>
            </div>
          </div>

          {/* Task List */}
          <div style={styles.taskList}>
            {tasks.length === 0 ? (
              <p style={{color:'#555', textAlign:'center', padding:'40px'}}>
                No tasks yet. Add your first task above!
              </p>
            ) : (
              tasks.map(task => (
                <div key={task.id} style={{
                  ...styles.taskCard,
                  opacity: task.status === 'completed' ? 0.5 : 1,
                  borderLeft: `4px solid ${priorityColor[task.priority]}`
                }}>
                  <div style={styles.taskCardLeft}>
                    <span style={{
                      ...styles.priorityBadge,
                      backgroundColor: priorityColor[task.priority] + '22',
                      color: priorityColor[task.priority]
                    }}>
                      {priorityLabel[task.priority]}
                    </span>
                    <div>
                      <p style={{
                        ...styles.taskCardTitle,
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p style={styles.taskCardDesc}>{task.description}</p>
                      )}
                      {task.due_date && (
                        <p style={styles.taskCardDate}>📅 Due: {task.due_date}</p>
                      )}
                    </div>
                  </div>
                  <div style={styles.taskCardActions}>
                    <button
                      onClick={() => toggleTask(task.id, task.status)}
                      style={task.status === 'completed' ? styles.undoBtn : styles.doneBtn}
                    >
                      {task.status === 'completed' ? '↩ Undo' : '✓ Done'}
                    </button>
                    <button onClick={() => deleteTask(task.id)} style={styles.deleteBtn}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <p style={styles.footer}>Auto-refreshing every 3 seconds</p>
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
  container:{backgroundColor:'#0d0d1a',minHeight:'100vh',padding:'20px',fontFamily:'monospace',color:'white'},
  loading:{backgroundColor:'#0d0d1a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#00d4aa'},
  header:{textAlign:'center',marginBottom:'20px'},
  title:{fontSize:'2.5rem',color:'#00d4aa',margin:0},
  subtitle:{color:'#888',marginTop:'5px'},
  tabRow:{display:'flex',gap:'10px',marginBottom:'20px',justifyContent:'center',flexWrap:'wrap'},
  tab:{padding:'10px 22px',borderRadius:'8px',border:'1px solid #2a2a4a',backgroundColor:'#1a1a2e',color:'#888',cursor:'pointer',fontSize:'0.9rem'},
  tabActive:{backgroundColor:'#00d4aa',color:'#0d0d1a',border:'1px solid #00d4aa',fontWeight:'bold'},
  cardRow:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'15px',marginBottom:'25px'},
  card:{backgroundColor:'#1a1a2e',borderRadius:'12px',padding:'20px',border:'1px solid #2a2a4a',textAlign:'center'},
  cardTitle:{color:'#888',fontSize:'0.85rem',margin:'0 0 8px 0'},
  cardValue:{fontSize:'2rem',fontWeight:'bold',margin:'0 0 5px 0'},
  cardSub:{color:'#666',fontSize:'0.75rem',margin:0},
  chartRow:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'15px',marginBottom:'20px'},
  chartBox:{backgroundColor:'#1a1a2e',borderRadius:'12px',padding:'20px',border:'1px solid #2a2a4a'},
  chartTitle:{color:'#ccc',fontSize:'0.95rem',marginTop:0,marginBottom:'15px'},
  processPanel:{backgroundColor:'#1a1a2e',borderRadius:'12px',padding:'20px',border:'1px solid #2a2a4a'},
  controls:{display:'flex',gap:'15px',alignItems:'center',marginBottom:'15px',flexWrap:'wrap'},
  searchInput:{flex:1,padding:'10px 15px',borderRadius:'8px',border:'1px solid #2a2a4a',backgroundColor:'#0d0d1a',color:'white',fontSize:'0.9rem',minWidth:'200px'},
  sortButtons:{display:'flex',gap:'8px',alignItems:'center'},
  sortLabel:{color:'#888',fontSize:'0.85rem'},
  sortBtn:{padding:'8px 16px',borderRadius:'6px',border:'1px solid #2a2a4a',backgroundColor:'#0d0d1a',color:'#888',cursor:'pointer'},
  sortBtnActive:{backgroundColor:'#00d4aa',color:'#0d0d1a',fontWeight:'bold',border:'1px solid #00d4aa'},
  procCount:{color:'#666',fontSize:'0.8rem',marginBottom:'10px'},
  tableWrapper:{overflowX:'auto',overflowY:'auto',maxHeight:'450px'},
  table:{width:'100%',borderCollapse:'collapse',fontSize:'0.85rem'},
  th:{padding:'12px 10px',textAlign:'left',color:'#00d4aa',borderBottom:'1px solid #2a2a4a',position:'sticky',top:0,backgroundColor:'#1a1a2e'},
  td:{padding:'8px 10px',color:'#ccc',borderBottom:'1px solid #111128'},
  killBtn:{padding:'4px 10px',borderRadius:'4px',border:'1px solid #ff4444',backgroundColor:'transparent',color:'#ff4444',cursor:'pointer',fontSize:'0.8rem'},
  vaultPanel:{backgroundColor:'#1a1a2e',borderRadius:'12px',padding:'30px',border:'1px solid #2a2a4a',maxWidth:'700px',margin:'0 auto'},
  vaultHeader:{textAlign:'center',marginBottom:'25px'},
  vaultTitle:{color:'#00d4aa',fontSize:'1.8rem',margin:0},
  vaultSubtitle:{color:'#888',fontSize:'0.9rem',marginTop:'8px'},
  vaultInfoRow:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'25px'},
  vaultInfoCard:{backgroundColor:'#0d0d1a',borderRadius:'10px',padding:'15px',textAlign:'center',border:'1px solid #2a2a4a'},
  vaultInfoIcon:{fontSize:'1.8rem',margin:'0 0 8px 0'},
  vaultInfoTitle:{color:'#00d4aa',fontWeight:'bold',margin:'0 0 5px 0',fontSize:'0.9rem'},
  vaultInfoText:{color:'#666',fontSize:'0.78rem',margin:0},
  uploadZone:{border:'2px dashed #2a2a4a',borderRadius:'12px',padding:'30px',textAlign:'center',marginBottom:'20px',backgroundColor:'#0d0d1a'},
  uploadIcon:{fontSize:'2.5rem',margin:'0 0 10px 0'},
  uploadText:{color:'#888',marginBottom:'15px',fontSize:'0.9rem'},
  fileInput:{color:'#ccc',fontSize:'0.85rem',cursor:'pointer'},
  selectedFile:{marginTop:'12px',color:'#888',fontSize:'0.85rem'},
  vaultBtnRow:{display:'flex',gap:'12px',marginBottom:'20px'},
  encryptBtn:{flex:1,padding:'14px',borderRadius:'8px',border:'none',backgroundColor:'#00d4aa',color:'#0d0d1a',fontWeight:'bold',fontSize:'1rem',cursor:'pointer'},
  decryptBtn:{flex:1,padding:'14px',borderRadius:'8px',border:'1px solid #4dabf7',backgroundColor:'transparent',color:'#4dabf7',fontWeight:'bold',fontSize:'1rem',cursor:'pointer'},
  vaultStatus:{padding:'14px',borderRadius:'8px',backgroundColor:'#0d0d1a',border:'1px solid #2a2a4a',textAlign:'center',marginBottom:'20px',color:'#ccc',fontSize:'0.95rem'},
  taskPanel:{backgroundColor:'#1a1a2e',borderRadius:'12px',padding:'25px',border:'1px solid #2a2a4a'},
  taskTitle:{color:'#00d4aa',fontSize:'1.6rem',margin:'0 0 5px 0'},
  taskSubtitle:{color:'#888',fontSize:'0.85rem',marginBottom:'25px'},
  taskForm:{backgroundColor:'#0d0d1a',borderRadius:'10px',padding:'20px',marginBottom:'20px',border:'1px solid #2a2a4a'},
  formTitle:{color:'#4dabf7',marginTop:0,fontSize:'1rem'},
  taskInput:{width:'100%',padding:'10px',borderRadius:'8px',border:'1px solid #2a2a4a',backgroundColor:'#1a1a2e',color:'white',fontSize:'0.9rem',marginBottom:'10px',boxSizing:'border-box'},
  taskFormRow:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'},
  taskSelect:{padding:'10px',borderRadius:'8px',border:'1px solid #2a2a4a',backgroundColor:'#1a1a2e',color:'white',fontSize:'0.9rem',width:'100%'},
  addTaskBtn:{width:'100%',padding:'12px',borderRadius:'8px',border:'none',backgroundColor:'#00d4aa',color:'#0d0d1a',fontWeight:'bold',fontSize:'1rem',cursor:'pointer'},
  taskMsg:{color:'#aaa',textAlign:'center',margin:'10px 0 0 0',fontSize:'0.9rem'},
  taskStats:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'},
  taskStatCard:{backgroundColor:'#0d0d1a',borderRadius:'10px',padding:'15px',textAlign:'center',border:'1px solid #2a2a4a'},
  taskList:{display:'flex',flexDirection:'column',gap:'10px'},
  taskCard:{backgroundColor:'#0d0d1a',borderRadius:'10px',padding:'15px',border:'1px solid #2a2a4a',display:'flex',justifyContent:'space-between',alignItems:'flex-start'},
  taskCardLeft:{display:'flex',gap:'12px',alignItems:'flex-start',flex:1},
  priorityBadge:{padding:'3px 10px',borderRadius:'20px',fontSize:'0.75rem',fontWeight:'bold',whiteSpace:'nowrap'},
  taskCardTitle:{color:'#fff',margin:'0 0 4px 0',fontSize:'0.95rem'},
  taskCardDesc:{color:'#666',margin:'0 0 4px 0',fontSize:'0.82rem'},
  taskCardDate:{color:'#4dabf7',margin:0,fontSize:'0.8rem'},
  taskCardActions:{display:'flex',gap:'8px',alignItems:'center'},
  doneBtn:{padding:'6px 14px',borderRadius:'6px',border:'none',backgroundColor:'#00d4aa',color:'#0d0d1a',cursor:'pointer',fontWeight:'bold',fontSize:'0.82rem'},
  undoBtn:{padding:'6px 14px',borderRadius:'6px',border:'1px solid #888',backgroundColor:'transparent',color:'#888',cursor:'pointer',fontSize:'0.82rem'},
  deleteBtn:{padding:'6px 10px',borderRadius:'6px',border:'1px solid #ff4444',backgroundColor:'transparent',color:'#ff4444',cursor:'pointer',fontSize:'0.85rem'},
  footer:{textAlign:'center',color:'#555',fontSize:'0.8rem',marginTop:'20px'}
};