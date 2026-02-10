import React from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import {Toaster} from 'react-hot-toast'
import Home from './components/Home.jsx'
import Signup_login from './components/Signup_login.jsx'

const App = () => {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style:{
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          },
        }}
      />
      <Routes>
        <Route path='/' element={<Home />} /> 
        <Route path='/Signup_login' element={<Signup_login />} />
      </Routes>
    </Router>
  )
}

export default App