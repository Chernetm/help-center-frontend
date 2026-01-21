// src/components/CaseRegister.jsx
import React, { useState } from 'react';
import { createCase} from "../api/cases"

const CaseRegister = () => {
  const [caseName, setCaseName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [message, setMessage] = useState('');

  
  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await createCase({
      name: caseName,
      description,
      department,
    });

    setMessage('Case registered successfully');
    setCaseName('');
    setDescription('');
    setDepartment('');
  } catch (error) {
    setMessage(
      error.response?.data?.error || 'Failed to register case'
    );
  }
};

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Register Case</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="caseName">Case Name</label>
          <input
            type="text"
            id="caseName"
            value={caseName}
            onChange={(e) => setCaseName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            rows="4"
            required
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="department">Department</label>
          <input
            type="text"
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
        >
          Register Case
        </button>
      </form>

      {message && <p className="mt-4 text-center text-red-500">{message}</p>}
    </div>
  );
};

export default CaseRegister;
