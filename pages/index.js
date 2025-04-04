import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [name, setName] = useState('');
  const [context, setContext] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [password, setPassword] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedOutlines, setExpandedOutlines] = useState({});
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Check if the password is correct
    if (password !== 'CIENCE') {
      setError('Incorrect password. Please enter the correct password to search.');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, context, dateFrom, dateTo }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error searching');
      }
      
      setResults(data);
      
      // Reset expanded outlines state when performing a new search
      setExpandedOutlines({});
    } catch (error) {
      console.error('Error searching:', error);
      setError(error.message || 'Failed to perform search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOutline = (resultId) => {
    setExpandedOutlines(prev => ({
      ...prev,
      [resultId]: !prev[resultId]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Gong Recordings</title>
        <meta name="description" content="Search CSV data by participant names and context" />
      </Head>
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Gong Recordings
        </h1>
        
        <form onSubmit={handleSearch} className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Participant Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter participant name"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">
              Search Content
            </label>
            <input
              type="text"
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search in brief"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <div>
                <input
                  type="date"
                  id="dateFrom"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                /><span>&nbsp;&nbsp;</span>
                <input
                  type="date"
                  id="dateTo"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter password to search"
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
        
        <div className="results-container bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Results</h2>
          
          {results.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {results.map((result) => (
                <li key={result.id} className="py-4">
                  <h3 className="text-lg font-semibold text-gray-900">{result.title}</h3>
                  <p className="text-sm text-gray-500"><strong>Date:</strong> {result.scheduled}</p>
                  <p className="text-sm text-gray-500"><strong>Participants:</strong> {result.participants.join(', ')}</p>
                  <a href={result.recording} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800">
                    <u>Recording Link</u>
                  </a>
                  {result.brief && <p className="text-sm text-gray-600"><strong>Brief:</strong> {result.brief}</p>}
                  
                  {result.outline && (
                    <div className="mt-2">
                      <div 
                        className={`outline-toggle ${expandedOutlines[result.id] ? 'active' : ''}`}
                        onClick={() => toggleOutline(result.id)}
                      >
                        <span className="outline-toggle-icon">▶</span>
                        <span className="text-sm font-medium text-gray-700"><strong>Show Outline</strong></span>
                      </div>
                      
                      <div className="outline-content ml-4 mt-2" style={{ display: expandedOutlines[result.id] ? 'block' : 'none' }}>
                        <ul className="list-disc pl-5 text-sm text-gray-600">
                          {result.outline.split('\n').map((line, index) => (
                            <li key={index}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No results found.</p>
          )}
        </div>
      </div>
    </div>
  );
}