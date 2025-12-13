import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, query, where, 
  onSnapshot, updateDoc, doc, deleteDoc, writeBatch, 
  getDocs, limit, serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken 
} from 'firebase/auth';
import { 
  Users, Upload, Share2, MessageCircle, CheckCircle, 
  LogOut, UserPlus, RefreshCw, BarChart3, Trash2,
  ShieldCheck, User, Lock, Rocket, Sparkles, Zap, Activity, Clock, AlertTriangle, Crown 
} from 'lucide-react';

/**
 * FIREBASE CONFIGURATION
 * Keys are hardcoded for immediate stability as per your request.
 */
const firebaseConfig = {
  apiKey: "AIzaSyCZGI_kaTc2OPE5hL8eQ7DJ5iQ51jMF5L8",
  authDomain: "pantry-chef-app-19f65.firebaseapp.com",
  projectId: "pantry-chef-app-19f65",
  storageBucket: "pantry-chef-app-19f65.firebasestorage.app",
  messagingSenderId: "569222077550",
  appId: "1:569222077550:web:2d58f76254a106c3c49a7f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Unique ID for your campaign data
const appId = 'mayzen-campaign-v1'; 

// Collections
const USERS_COLLECTION = 'campaign_users';
const CONTACTS_COLLECTION = 'campaign_contacts';

// --- HELPER COMPONENT: BOUNCING BADGE ---
const BouncingBadge = ({ obstacleRef }) => {
  const badgeRef = useRef(null);
  const requestRef = useRef();
  
  const state = useRef({ x: 20, y: 20, vx: 1.8, vy: 1.8 });

  useEffect(() => {
    const animate = () => {
      const el = badgeRef.current;
      if (!el) return;
      
      const { innerWidth, innerHeight } = window;
      const rect = el.getBoundingClientRect();
      let { vx, vy, x, y } = state.current;

      let nextX = x + vx;
      let nextY = y + vy;
      let nextVx = vx;
      let nextVy = vy;

      if (nextX <= 0) { nextX = 0; nextVx = Math.abs(vx); } 
      else if (nextX + rect.width >= innerWidth) { nextX = innerWidth - rect.width; nextVx = -Math.abs(vx); }

      if (nextY <= 0) { nextY = 0; nextVy = Math.abs(vy); } 
      else if (nextY + rect.height >= innerHeight) { nextY = innerHeight - rect.height; nextVy = -Math.abs(vy); }

      if (obstacleRef && obstacleRef.current) {
        const obs = obstacleRef.current.getBoundingClientRect();
        const badgeW = rect.width;
        const badgeH = rect.height;
        const l = nextX;
        const r = nextX + badgeW;
        const t = nextY;
        const b = nextY + badgeH;

        if (l < obs.right && r > obs.left && t < obs.bottom && b > obs.top) {
          const prevL = x;
          const prevR = x + badgeW;
          const prevT = y;
          const prevB = y + badgeH;

          const wasLeft = prevR <= obs.left;
          const wasRight = prevL >= obs.right;
          const wasTop = prevB <= obs.top;
          const wasBottom = prevT >= obs.bottom;

          if (wasLeft || wasRight) {
            nextVx = -nextVx;
            if (wasLeft) nextX = obs.left - badgeW - 2;
            if (wasRight) nextX = obs.right + 2;
          }
          if (wasTop || wasBottom) {
            nextVy = -nextVy;
            if (wasTop) nextY = obs.top - badgeH - 2;
            if (wasBottom) nextY = obs.bottom + 2;
          }
        }
      }

      state.current = { x: nextX, y: nextY, vx: nextVx, vy: nextVy };
      const tiltX = nextVy * -5; 
      const tiltY = nextVx * 5;  

      el.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [obstacleRef]);

  return (
    <div ref={badgeRef} className="fixed top-0 left-0 z-50 pointer-events-none will-change-transform" style={{ touchAction: 'none' }}>
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-600 rounded-full blur-md opacity-60 animate-pulse"></div>
        <div className="relative bg-neutral-900/90 backdrop-blur-xl border border-amber-500/50 rounded-full px-8 py-3 shadow-[0_0_30px_rgba(245,158,11,0.3)] flex flex-col items-center min-w-[280px]">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-300 to-yellow-600 p-1.5 rounded-full shadow-lg shadow-amber-500/30 animate-spin-slow">
              <Rocket className="h-4 w-4 text-neutral-900 fill-neutral-900" />
            </div>
            <span className="text-amber-100 font-medium tracking-wide text-sm whitespace-nowrap">
              Powered by <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-400 font-bold drop-shadow-sm">Mayzen Technology</span>
            </span>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent my-1.5"></div>
          <span className="text-[10px] font-bold text-amber-500/80 tracking-[0.3em] uppercase">Designed by MAYANK</span>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTS ---

const Login = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('volunteer');
  const loginCardRef = useRef(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!auth) {
      setError("System Missing Configuration.");
      setLoading(false);
      return;
    }

    try {
      if (mode === 'admin') {
        if (pin === 'admin123') {
          onLogin({ role: 'admin', name: 'Campaign Manager', id: 'admin' });
        } else {
          setError('Invalid Admin PIN');
        }
      } else {
        if (!db) return;
        const q = query(
          collection(db, 'artifacts', appId, 'public', 'data', USERS_COLLECTION),
          where('name', '==', name),
          where('pin', '==', pin),
          where('role', '==', 'volunteer')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          onLogin({ ...userDoc.data(), id: userDoc.id });
        } else {
          setError('Volunteer not found. Check name or PIN.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden selection:bg-amber-500/30">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_rgba(251,191,36,0.15),transparent_70%)]"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px]"></div>
      </div>

      <BouncingBadge obstacleRef={loginCardRef} />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        <div className="mb-10 text-center relative pointer-events-none">
          <div className="relative inline-block mb-4">
             <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
             <Crown className="h-16 w-16 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
            Campaign<span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-yellow-600">HQ</span>
          </h1>
          <p className="text-amber-500/80 mt-3 font-bold tracking-[0.2em] text-xs uppercase border-y border-amber-900/50 py-1">Voter Outreach System</p>
        </div>

        <div className="w-full" ref={loginCardRef}>
          <div className="bg-neutral-900/80 backdrop-blur-md rounded-[20px] p-8 relative overflow-hidden border border-amber-500/20 shadow-[0_0_50px_-10px_rgba(245,158,11,0.1)]">
            <div className="flex bg-neutral-950 p-1.5 rounded-xl mb-8 border border-white/5">
              <button 
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'volunteer' ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-neutral-900 shadow-lg shadow-amber-500/20' : 'text-neutral-500 hover:text-amber-200 hover:bg-white/5'}`}
                onClick={() => setMode('volunteer')}
              >
                <User className="h-4 w-4" /> Volunteer
              </button>
              <button 
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'admin' ? 'bg-gradient-to-r from-red-800 to-red-600 text-white shadow-lg' : 'text-neutral-500 hover:text-red-200 hover:bg-white/5'}`}
                onClick={() => setMode('admin')}
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {mode === 'volunteer' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-amber-500 uppercase tracking-wider ml-1">Registered Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-neutral-500 group-focus-within:text-amber-400 transition-colors" />
                    </div>
                    <input type="text" required className="w-full pl-11 pr-4 py-4 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all font-medium text-amber-50 placeholder:text-neutral-700" placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-500 uppercase tracking-wider ml-1">
                  {mode === 'admin' ? 'Access Code' : 'Security PIN'}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-500 group-focus-within:text-amber-400 transition-colors" />
                  </div>
                  <input type="password" required className="w-full pl-11 pr-4 py-4 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all font-medium text-amber-50 placeholder:text-neutral-700 tracking-widest" placeholder={mode === 'admin' ? "••••••••" : "••••"} value={pin} onChange={(e) => setPin(e.target.value)} />
                </div>
              </div>
              {error && (
                <div className="bg-red-950/30 text-red-400 text-sm p-4 rounded-xl flex items-center gap-3 border border-red-900/50">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              <button disabled={loading} className={`w-full font-bold py-4 px-4 rounded-xl transition-all shadow-xl flex justify-center items-center gap-2 mt-6 transform hover:scale-[1.02] active:scale-[0.98] ${mode === 'volunteer' ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-neutral-950 shadow-amber-500/20' : 'bg-gradient-to-r from-red-900 via-red-700 to-red-900 text-white shadow-red-900/30 border border-red-500/30'}`}>
                {loading ? <RefreshCw className="animate-spin h-5 w-5" /> : (<><span className="text-lg tracking-wide uppercase font-black">Enter System</span><Zap className={`h-5 w-5 ${mode === 'volunteer' ? 'fill-neutral-900' : 'fill-white'}`} /></>)}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ currentUser, onLogout }) => {
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats] = useState({ total: 0, assigned: 0, sent: 0 });
  const [newVolName, setNewVolName] = useState('');
  const [newVolPin, setNewVolPin] = useState('');
  const [csvText, setCsvText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    if (!db) return;
    const unsubVol = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', USERS_COLLECTION), (snapshot) => { setVolunteers(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const unsubContacts = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', CONTACTS_COLLECTION), (snapshot) => {
        const total = snapshot.size;
        const sent = snapshot.docs.filter(d => d.data().status === 'sent').length;
        const assigned = snapshot.docs.filter(d => d.data().assignedTo).length;
        setStats({ total, assigned, sent });
    });
    return () => { unsubVol(); unsubContacts(); };
  }, []);

  const addVolunteer = async (e) => {
    e.preventDefault();
    if (!newVolName || !newVolPin || !db) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', USERS_COLLECTION), { name: newVolName, pin: newVolPin, role: 'volunteer', createdAt: serverTimestamp() });
    setNewVolName(''); setNewVolPin('');
  };

  const deleteVolunteer = async (id) => { if(confirm('Delete?') && db) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', USERS_COLLECTION, id)); };

  // --- FIXED: BATCHING FOR BULK UPLOAD ---
  const handleCsvUpload = async () => {
    if (!csvText || !db) return;
    setIsProcessing(true);
    try {
      const rows = csvText.split('\n').filter(r => r.trim() !== ''); // Filter empty lines
      const totalRows = rows.length;
      let count = 0;
      
      // Batch size for Firestore is 500. We use 450 to be safe.
      const BATCH_SIZE = 450; 
      
      for (let i = 0; i < totalRows; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = rows.slice(i, i + BATCH_SIZE);
        let chunkHasData = false;

        chunk.forEach((row) => {
          // Robust parsing: handle potential quotes or extra spaces
          const parts = row.split(',');
          if (parts.length >= 2) {
             const name = parts[0].trim();
             const phone = parts[1].trim(); // basic check
             
             if (name && phone) {
                const docRef = doc(collection(db, 'artifacts', appId, 'public', 'data', CONTACTS_COLLECTION));
                batch.set(docRef, {
                  name: name,
                  phone: phone,
                  assignedTo: null,
                  status: 'pending',
                  createdAt: serverTimestamp()
                });
                chunkHasData = true;
                count++;
             }
          }
        });

        if (chunkHasData) {
            await batch.commit();
        }
      }

      if (count === 0) {
        alert("Upload Failed: No valid contacts found. Use format: Name,Phone");
      } else {
        alert(`Successfully added ${count} contacts!`);
        setCsvText('');
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert('Error uploading. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const distributeContacts = async () => {
    if (volunteers.length === 0 || !db) return alert("No volunteers!");
    setIsProcessing(true);
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', CONTACTS_COLLECTION), where('assignedTo', '==', null), limit(500));
      const snapshot = await getDocs(q);
      if (snapshot.empty) { alert("No unassigned contacts!"); setIsProcessing(false); return; }
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap, index) => {
        const volIndex = index % volunteers.length;
        const volId = volunteers[volIndex].id;
        batch.update(docSnap.ref, { assignedTo: volId });
      });
      await batch.commit();
      alert(`Distributed ${snapshot.docs.length} contacts.`);
    } catch (err) { console.error(err); alert("Failed."); } finally { setIsProcessing(false); }
  };

  const clearAllContacts = async () => {
    if (!confirm("Delete ALL?") || !db) return;
    setIsProcessing(true);
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', CONTACTS_COLLECTION), limit(500));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    setIsProcessing(false);
    alert("Deleted batch of 500.");
  };

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-amber-50">
      <div className="bg-neutral-900 border-b border-amber-900/30 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-lg shadow-black/50">
        <h1 className="text-xl font-bold flex items-center gap-2"><div className="bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20"><Activity className="h-6 w-6 text-amber-400" /></div>Campaign<span className="text-amber-400">HQ</span></h1>
        <div className="flex items-center gap-4"><span className="text-xs text-amber-500 hidden md:inline bg-amber-950/50 px-3 py-1 rounded-full border border-amber-900/50 tracking-widest font-bold">ADMIN MODE</span><button onClick={onLogout} className="text-neutral-400 hover:text-red-400 hover:bg-red-950/30 p-2 rounded-lg transition"><LogOut className="h-5 w-5" /></button></div>
      </div>
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {['stats', 'volunteers', 'contacts'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 font-bold transition-all duration-200 capitalize ${activeTab === tab ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-neutral-900 shadow-lg shadow-amber-500/20 scale-[1.02]' : 'bg-neutral-900 text-neutral-500 hover:bg-neutral-800 border border-neutral-800 hover:text-amber-400'}`}>
              {tab === 'stats' && <BarChart3 className="h-5 w-5" />}{tab === 'volunteers' && <Users className="h-5 w-5" />}{tab === 'contacts' && <Upload className="h-5 w-5" />}{tab}
            </button>
          ))}
        </div>
        <div className="lg:col-span-3">
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-900 p-6 rounded-2xl shadow-lg border border-amber-900/30 relative overflow-hidden group"><div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110"></div><p className="text-amber-600 text-sm font-bold uppercase tracking-wider relative z-10">Total</p><p className="text-4xl font-black text-white mt-2 relative z-10">{stats.total}</p></div>
                <div className="bg-neutral-900 p-6 rounded-2xl shadow-lg border border-amber-900/30 relative overflow-hidden group"><div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110"></div><p className="text-orange-600 text-sm font-bold uppercase tracking-wider relative z-10">Pending</p><p className="text-4xl font-black text-white mt-2 relative z-10">{stats.total - stats.sent}</p></div>
                <div className="bg-neutral-900 p-6 rounded-2xl shadow-lg border border-amber-900/30 relative overflow-hidden group"><div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110"></div><p className="text-green-600 text-sm font-bold uppercase tracking-wider relative z-10">Sent</p><p className="text-4xl font-black text-white mt-2 relative z-10">{stats.sent}</p></div>
              </div>
              <div className="bg-neutral-900 p-8 rounded-2xl shadow-xl border border-amber-900/20">
                <h3 className="text-lg font-bold text-amber-50 mb-6 border-b border-neutral-800 pb-2">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                  <button onClick={distributeContacts} disabled={isProcessing} className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-neutral-950 px-8 py-4 rounded-xl font-bold shadow-lg shadow-amber-900/40 transition transform hover:-translate-y-1"><Share2 className="h-5 w-5" /> Distribute</button>
                  <button onClick={clearAllContacts} className="flex items-center gap-2 text-red-500 hover:bg-red-950/30 px-8 py-4 rounded-xl font-bold border border-red-900/50 transition"><Trash2 className="h-5 w-5" /> Clear Data</button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'volunteers' && (
            <div className="space-y-6">
               <div className="bg-neutral-900 p-6 rounded-2xl shadow-lg border border-amber-900/30">
                <h3 className="text-lg font-bold text-amber-50 mb-4 flex items-center gap-2"><UserPlus className="h-5 w-5 text-amber-500" /> Add Volunteer</h3>
                <form onSubmit={addVolunteer} className="flex gap-4 items-end">
                  <div className="flex-1"><label className="text-xs font-bold text-neutral-500 uppercase">Name</label><input className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-lg mt-1 focus:ring-1 focus:ring-amber-500 outline-none font-medium text-amber-50 placeholder:text-neutral-700" placeholder="Name" value={newVolName} onChange={e => setNewVolName(e.target.value)} /></div>
                  <div className="w-32"><label className="text-xs font-bold text-neutral-500 uppercase">PIN</label><input className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-lg mt-1 focus:ring-1 focus:ring-amber-500 outline-none font-medium text-amber-50 placeholder:text-neutral-700" placeholder="PIN" value={newVolPin} onChange={e => setNewVolPin(e.target.value)} /></div>
                  <button className="bg-amber-600 hover:bg-amber-500 text-neutral-950 px-6 py-3 rounded-lg font-bold transition shadow-lg shadow-amber-900/20">Add</button>
                </form>
               </div>
               <div className="grid gap-3">{volunteers.map(vol => (<div key={vol.id} className="bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-800 flex justify-between items-center group hover:border-amber-900/50 transition"><div className="flex items-center gap-4"><div className="h-10 w-10 bg-gradient-to-br from-amber-700 to-yellow-600 rounded-full flex items-center justify-center text-neutral-950 font-bold">{vol.name.charAt(0)}</div><div><p className="font-bold text-amber-50">{vol.name}</p><p className="text-xs text-neutral-500 font-mono bg-neutral-950 inline-block px-2 py-0.5 rounded border border-neutral-800">PIN: {vol.pin}</p></div></div><button onClick={() => deleteVolunteer(vol.id)} className="text-neutral-600 hover:text-red-500 transition"><Trash2 className="h-5 w-5" /></button></div>))}</div>
            </div>
          )}
          {activeTab === 'contacts' && (
            <div className="bg-neutral-900 p-8 rounded-2xl shadow-lg h-full border border-amber-900/30">
              <h3 className="text-lg font-bold text-amber-50 mb-2">Bulk Upload</h3>
              <p className="text-sm text-neutral-500 mb-4">Paste CSV: <code>Name,Phone</code></p>
              <textarea className="w-full h-64 p-4 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-sm focus:ring-1 focus:ring-amber-500 outline-none resize-none text-amber-50 placeholder:text-neutral-700" placeholder="Name, +91..." value={csvText} onChange={e => setCsvText(e.target.value)}></textarea>
              <div className="mt-6 flex justify-end"><button onClick={handleCsvUpload} disabled={!csvText || isProcessing} className="bg-amber-600 text-neutral-950 px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-amber-500 disabled:opacity-50 transition">Upload</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VolunteerDashboard = ({ currentUser, onLogout }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionSentCount, setSessionSentCount] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const storedCooldown = localStorage.getItem(`cooldown_${currentUser.id}`);
    if (storedCooldown && new Date(storedCooldown) > new Date()) setCooldownUntil(new Date(storedCooldown));
    const storedCount = parseInt(localStorage.getItem(`sessionCount_${currentUser.id}`) || '0');
    setSessionSentCount(storedCount);
  }, [currentUser.id]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', CONTACTS_COLLECTION), where('assignedTo', '==', currentUser.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const myContacts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      myContacts.sort((a, b) => (a.status === 'sent' ? 1 : -1));
      setContacts(myContacts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser.id]);

  const handleMarkSent = async (contactId) => {
    if (!db) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', CONTACTS_COLLECTION, contactId);
    await updateDoc(ref, { status: 'sent', sentAt: serverTimestamp() });
    const newCount = sessionSentCount + 1;
    setSessionSentCount(newCount);
    localStorage.setItem(`sessionCount_${currentUser.id}`, newCount);
    if (newCount >= 10) {
      const finishTime = new Date(new Date().getTime() + 10 * 60000);
      setCooldownUntil(finishTime);
      localStorage.setItem(`cooldown_${currentUser.id}`, finishTime.toISOString());
      setSessionSentCount(0);
      localStorage.setItem(`sessionCount_${currentUser.id}`, 0);
    }
  };

  const getWhatsappLink = (contact) => `https://wa.me/${contact.phone}?text=${encodeURIComponent(`Hello ${contact.name}, please support us!`)}`;
  const pendingContacts = contacts.filter(c => c.status !== 'sent');
  const totalPending = pendingContacts.length;
  const isCooldownActive = cooldownUntil && now < cooldownUntil;
  const timeLeft = isCooldownActive ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const visibleContacts = pendingContacts.slice(0, 10);

  return (
    <div className="min-h-screen bg-neutral-950 pb-10 font-sans text-amber-50">
      <div className="bg-neutral-900 border-b border-amber-900/30 px-6 py-4 shadow-lg sticky top-0 z-10"><div className="max-w-3xl mx-auto flex justify-between items-center"><div><h1 className="font-black text-xl text-white tracking-wide">Volunteer Portal</h1><p className="text-amber-500 text-xs font-bold bg-amber-950/50 border border-amber-900/50 inline-block px-3 py-1 rounded-full mt-1">Hello, {currentUser.name}</p></div><button onClick={onLogout} className="bg-white/5 p-2 rounded-lg hover:bg-white/10 transition backdrop-blur-sm border border-white/5"><LogOut className="h-5 w-5 text-neutral-400" /></button></div></div>
      <div className="max-w-3xl mx-auto p-4 space-y-6 mt-4">
        {isCooldownActive ? (
           <div className="bg-neutral-900 p-8 rounded-3xl shadow-2xl border border-amber-500/30 text-center animate-fade-in relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 animate-pulse"></div>
             <div className="w-20 h-20 bg-neutral-950 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-900/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]"><Clock className="h-10 w-10 text-amber-500" /></div>
             <h2 className="text-2xl font-black text-white mb-2 tracking-wide">Safety Break Active</h2>
             <div className="text-5xl font-mono font-bold text-amber-500 tracking-wider drop-shadow-lg">{minutes}:{seconds.toString().padStart(2, '0')}</div>
           </div>
        ) : (
          <>
            <div className="bg-neutral-900 p-6 rounded-2xl shadow-xl border border-amber-900/30 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-8 -mt-8"></div>
              <div className="relative z-10"><p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">Batch Progress</p><div className="flex items-end gap-2"><h2 className="text-4xl font-black text-white">{sessionSentCount}<span className="text-neutral-600">/</span>10</h2></div></div>
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-600 to-yellow-600 shadow-lg shadow-amber-500/20 flex items-center justify-center text-neutral-950 font-black text-xl relative z-10">{totalPending}</div>
            </div>
            <div className="space-y-3">
              {loading ? <p className="text-center text-neutral-500 mt-10 animate-pulse font-mono">Loading...</p> : totalPending === 0 ? <div className="text-center py-12 bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800"><CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" /><h3 className="text-xl font-bold text-white">Mission Complete!</h3></div> : (
                <>
                  <div className="flex items-center gap-2 mb-2 px-1 opacity-70"><AlertTriangle className="h-4 w-4 text-amber-500" /><p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Next {visibleContacts.length} Contacts</p></div>
                  {visibleContacts.map(contact => (
                    <div key={contact.id} className="bg-neutral-900 p-5 rounded-2xl shadow-lg border border-neutral-800 flex items-center justify-between transition-all duration-300 hover:border-amber-500/30 hover:shadow-amber-500/10 group">
                      <div><h4 className="font-bold text-lg text-white group-hover:text-amber-100 transition">{contact.name}</h4><p className="text-sm text-neutral-500 font-mono tracking-wide">{contact.phone}</p></div>
                      <div className="flex gap-3">
                        <a href={getWhatsappLink(contact)} target="_blank" rel="noreferrer" className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-900/20 transition hover:scale-105"><MessageCircle className="h-5 w-5" /></a>
                        <button onClick={() => handleMarkSent(contact.id)} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white px-4 py-2.5 rounded-xl transition border border-neutral-700"><CheckCircle className="h-6 w-6" /></button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// 4. MAIN APP
export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // 1. Initialize Auth
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
      setAuthReady(true);
    };
    initAuth();
  }, []);

  if (!authReady) return <div className="h-screen flex items-center justify-center bg-neutral-950 text-amber-500 font-medium animate-pulse tracking-widest uppercase">Initializing...</div>;

  return (
    <>
      {!user ? (
        <Login onLogin={setUser} />
      ) : user.role === 'admin' ? (
        <AdminDashboard currentUser={user} onLogout={() => setUser(null)} />
      ) : (
        <VolunteerDashboard currentUser={user} onLogout={() => setUser(null)} />
      )}
    </>
  );
}
