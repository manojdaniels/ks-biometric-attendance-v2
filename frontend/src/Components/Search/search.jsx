// Search.jsx
import React, { useState } from 'react';
import { getUser} from '../../api';

const Search = ({ onSearch }) => {
 const [searchTerm, setSearchTerm] = useState("");

  const fetchSearch = async () => {
    try {
    const data = await getUser({
      date: new Date(),
      search: searchTerm,
      format: "json"
    });
    onSearch?.(data);
  } catch (err) {
    console.error(err.message);
  }
  };

  return (
    <div className='searchUser'>
      <input
        type='text'
        className='searching'
        placeholder='Search input here...'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && fetchSearch()}
      />
      <button onClick={fetchSearch}>Search</button>
    </div>
  );
};

export default Search;
