import React, { useEffect, useState } from 'react';
import './CustomerData.css'; // Import the CSS file
import { fetchcustomerdata } from '../../api';
import { FaArrowLeft} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from '../header/Header';

export const CustomerData = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]); // State for filtered customers
  const [loading, setLoading] = useState(false); // Loading state
    const [Search, setSearch] = useState(""); // State for search query
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Start loading
      try {
        const storedCustomers = await fetchcustomerdata(); // Fetch from API
        setCustomers(storedCustomers);
        setFilteredCustomers(storedCustomers); // Initialize filtered customers
      } catch (error) {
        console.error("Error fetching customer data:", error.message);
      }  finally {
        setLoading(false); // Stop loading
      }
    };
  
    fetchData();
  
    // Load localStorage customers as a fallback
    const localStorageCustomers = JSON.parse(localStorage.getItem('customers')) || [];
    if (localStorageCustomers.length > 0) {
      setCustomers(localStorageCustomers);
      setFilteredCustomers(localStorageCustomers); // Initialize filtered customers=
    }
  }, []);  

  useEffect(() => {
    const searchLower = Search.toLowerCase();
  
    const results = customers.filter(customer => {
      const nameMatch = customer.name && customer.name.toLowerCase().includes(searchLower);
      const phoneMatch = customer.phone && String(customer.phone).toLowerCase().includes(searchLower);
      const addressMatch = customer.address && customer.address.toLowerCase().includes(searchLower);
  
      return nameMatch || phoneMatch || addressMatch; // Match any field
    });
  
    setFilteredCustomers(results);
  }, [Search, customers]);
  
  
    
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
           <Header headerName="Customer Data" setSearch={setSearch}/>

    <div className="customer-data-container">
      {loading ? (
        <div className="lds-ripple"><div></div><div></div></div>
        ) : (
          <>
          {filteredCustomers.length === 0 ? (
            <p className="no-customers-message">No customers found.</p>
          ) : (
            <ul className="customer-list">
              {filteredCustomers.map((customer, index) => (
                <li key={index} className="customer-item">
                  <h3 className="customer-title">Customer {index + 1}</h3>
                  <p><strong>Name:</strong> {customer.name}</p>
                  <p><strong>Phone:</strong> {customer.phone}</p>
                  <p><strong>Address:</strong> {customer.address}</p>
                </li>
              ))}
            </ul>
          )}
        </>
       )}
    </div>
    </>
  );
};
