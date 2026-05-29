import React, { useEffect, useState } from 'react';
import { Plus, Zap, RefreshCw } from 'lucide-react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, setDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { PasswordEntry } from '../types';

export function PasswordPage() {
  const [data, setData] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [newTid, setNewTid] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'passwords'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as PasswordEntry[];
      setData(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'passwords');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const generateRandomString = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSimulateInstall = async () => {
    setLoading(true);
    try {
      const randomChars = generateRandomString(5);
      const now = Date.now();
      const fakeDeviceId = `android-${generateRandomString(16).toLowerCase()}`;
      
      const passRef = collection(db, 'passwords');

      await addDoc(passRef, {
        tid: `Trial-${randomChars}`,
        password: "trial",
        status: "Trial",
        session: "8 Jam",
        createdAt: now,
        deviceId: fakeDeviceId,
      });

      // Update stats
      const statsRef = doc(db, 'stats', 'general');
      const statsDoc = await getDoc(statsRef);
      if (statsDoc.exists()) {
        await setDoc(statsRef, {
          userActive: statsDoc.data().userActive + 1,
          deviceInstall: statsDoc.data().deviceInstall + 1,
          userTrial: statsDoc.data().userTrial + 1
        });
      } else {
        await setDoc(statsRef, { userActive: 1, deviceInstall: 1, userTrial: 1 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (item: PasswordEntry) => {
    if (!window.confirm("Upgrade to Berbayar? This will generate a new password.")) return;
    try {
      const newPassword = Math.floor(100000 + Math.random() * 900000).toString();
      const newTid = item.tid.replace('Trial-', 'TID-');
      await updateDoc(doc(db, 'passwords', item.id), { status: 'Berbayar', session: 'Life Time', password: newPassword, tid: newTid });
      alert("Upgrade berhasil!");
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengupdate: " + err.message);
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'passwords'), {
        tid: newTid,
        password: newPassword,
        status: 'Berbayar',
        session: 'Life Time',
        createdAt: Date.now()
      });
      setNewTid('');
      setNewPassword('');
      setShowModal(false);
      
      const statsRef = doc(db, 'stats', 'general');
      const statsDoc = await getDoc(statsRef);
      if (statsDoc.exists()) {
        await setDoc(statsRef, {
          userActive: statsDoc.data().userActive + 1,
          deviceInstall: statsDoc.data().deviceInstall + 1,
          userTrial: statsDoc.data().userTrial
        });
      } else {
        await setDoc(statsRef, { userActive: 1, deviceInstall: 1, userTrial: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSession = async (id: string, sessionValue: string) => {
    try {
      await updateDoc(doc(db, 'passwords', id), { session: sessionValue });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (item: PasswordEntry) => {
    try {
      const newStatus = item.status === 'Expired' 
        ? (item.tid.startsWith('Trial-') ? 'Trial' : 'Berbayar') 
        : 'Expired';
      await updateDoc(doc(db, 'passwords', item.id), { status: newStatus });
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengupdate: " + err.message);
    }
  };

  const handleDelete = async (id: string, status: string) => {
    if (!window.confirm("Are you sure you want to delete this registry?")) return;
    try {
      await deleteDoc(doc(db, 'passwords', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
      <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-4 shrink-0">
        <h2 className="text-xl font-medium text-slate-900 dark:text-white hidden sm:block">Integrated Device Registry</h2>
        
        <div className="flex gap-3">
          <button
            onClick={handleSimulateInstall}
            disabled={loading}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all border border-slate-200 dark:border-slate-700 shadow-sm disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            Simulate API Install
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-[0_4px_20px_rgba(99,102,241,0.3)] dark:shadow-[0_4px_20px_rgba(99,102,241,0.2)] disabled:opacity-50"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Register Device</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="text-slate-500 text-xs uppercase tracking-tighter sticky top-0 bg-slate-50/95 dark:bg-[#060c1c]/95 backdrop-blur-md z-10 border-b border-slate-200 dark:border-slate-800/50">
              <tr>
                <th className="px-8 py-5 font-bold whitespace-nowrap">Terminal ID (TID)</th>
                <th className="px-8 py-5 font-bold whitespace-nowrap">ID Perangkat</th>
                <th className="px-8 py-5 font-bold whitespace-nowrap">Password</th>
                <th className="px-8 py-5 font-bold whitespace-nowrap">Status</th>
                <th className="px-8 py-5 font-bold whitespace-nowrap">Session Validity</th>
                <th className="px-8 py-5 font-bold whitespace-nowrap">Session Option</th>
                <th className="px-8 py-5 font-bold whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className={`px-8 py-5 font-mono whitespace-nowrap ${item.status === 'Berbayar' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-500'}`}>
                    {item.tid}
                  </td>
                  <td className="px-8 py-5 font-mono whitespace-nowrap text-slate-500 text-xs">
                    {item.deviceId || '-'}
                  </td>
                  <td className={`px-8 py-5 font-mono whitespace-nowrap ${item.status === 'Berbayar' ? 'tracking-widest text-slate-900 dark:text-slate-200 font-semibold' : 'text-slate-500 dark:text-slate-500 uppercase'}`}>
                    {item.password}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                     <span
                      className={`px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        item.status === 'Berbayar'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                          : item.status === 'Trial'
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 border-rose-200 dark:border-rose-500/20'
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className={`px-8 py-5 whitespace-nowrap ${item.status === 'Expired' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'}`}>
                    {item.session}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <select
                      value={item.session}
                      onChange={(e) => handleUpdateSession(item.id, e.target.value)}
                      className="bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="8 Jam">8 Jam</option>
                      <option value="1 Hari">1 Hari</option>
                      <option value="7 Hari">7 Hari</option>
                      <option value="30 Hari">30 Hari</option>
                      <option value="Life Time">Life Time</option>
                    </select>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex gap-2">
                      {item.status === 'Trial' && (
                        <button
                          onClick={() => handleUpgrade(item)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Upgrade Berbayar
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          item.status === 'Expired'
                            ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {item.status === 'Expired' ? 'Aktifkan' : 'Non-aktif'}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.status)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-8 py-10 text-center text-slate-500">
                    No data available. Use simulate install to simulate an API hit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-8 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Register Device</h2>
            <form onSubmit={handleAddManual} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">TID</label>
                <input
                  required
                  value={newTid}
                  onChange={e => setNewTid(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white font-mono placeholder:text-slate-400 transition-colors"
                  placeholder="TID-12345"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
                <input
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white font-mono tracking-widest placeholder:text-slate-400 placeholder:tracking-normal transition-colors"
                  placeholder="000000"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 rounded-xl transition-all disabled:opacity-50"
                >
                  Save Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
