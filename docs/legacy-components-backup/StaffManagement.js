import React, { useState } from 'react';

// Dummy initial staff data (replace with real data source or context as needed)
const initialStaff = [
  { id: 1, name: 'Alice Johnson', role: 'Server', email: 'alice@vhbanquets.com' },
  { id: 2, name: 'Bob Smith', role: 'Chef', email: 'bob@vhbanquets.com' },
];

export default function StaffManagement() {
  const [staff, setStaff] = useState(initialStaff);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', role: '', email: '' });

  const handleEdit = (member) => {
    setEditing(member.id);
    setForm({ name: member.name, role: member.role, email: member.email });
  };

  const handleDelete = (id) => {
    setStaff(staff.filter((m) => m.id !== id));
    if (editing === id) setEditing(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      setStaff(staff.map((m) => (m.id === editing ? { ...m, ...form } : m)));
      setEditing(null);
    } else {
      setStaff([
        ...staff,
        { id: Date.now(), ...form },
      ]);
    }
    setForm({ name: '', role: '', email: '' });
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Staff Management</h2>
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
        <div className="mb-2">
          <label htmlFor="staff-name" className="block text-sm font-medium text-gray-700">Name</label>
          <input 
            id="staff-name" 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            required 
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
          />
        </div>
        <div className="mb-2">
          <label htmlFor="staff-role" className="block text-sm font-medium text-gray-700">Role</label>
          <input 
            id="staff-role" 
            name="role" 
            value={form.role} 
            onChange={handleChange} 
            required 
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
          />
        </div>
        <div className="mb-2">
          <label htmlFor="staff-email" className="block text-sm font-medium text-gray-700">Email</label>
          <input 
            id="staff-email" 
            name="email" 
            type="email" 
            value={form.email} 
            onChange={handleChange} 
            required 
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
          />
        </div>
        <button type="submit" className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          {editing ? 'Update Staff' : 'Add Staff'}
        </button>
        {editing && (
          <button type="button" onClick={() => { setEditing(null); setForm({ name: '', role: '', email: '' }); }} className="ml-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
        )}
      </form>
      <div className="bg-white rounded shadow">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">Role</th>
              <th className="py-2 px-3">Email</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-t">
                <td className="py-2 px-3">{member.name}</td>
                <td className="py-2 px-3">{member.role}</td>
                <td className="py-2 px-3">{member.email}</td>
                <td className="py-2 px-3">
                  <button onClick={() => handleEdit(member)} className="text-indigo-600 hover:underline mr-2">Edit</button>
                  <button onClick={() => handleDelete(member.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr><td colSpan={4} className="text-center py-4 text-gray-500">No staff members found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
