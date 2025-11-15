import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Inventory from './pages/Inventory'
import EditInventory from './pages/EditInventory'
import CreateBatch from './pages/CreateBatch'
import CreateInventory from './pages/CreateInventory'
import Account from './pages/Account'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation />
      <Container 
        component="main" 
        sx={{ 
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3, md: 3 },
          flexGrow: 1,
          width: '100%',
          maxWidth: { xs: '100%', sm: '600px', md: '900px', lg: '1200px', xl: '1536px' }
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/:id" element={<EditInventory />} />
          <Route path="/create-batch" element={<CreateBatch />} />
          <Route path="/create-inventory" element={<CreateInventory />} />
          <Route path="/account" element={<Account />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset" element={<ResetPassword />} />
        </Routes>
      </Container>
    </Box>
  )
}


