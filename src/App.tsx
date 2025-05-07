import { Routes, Route } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import HomePage from './pages/HomePage'
import GeneratorPage from './pages/GeneratorPage'
import MyCreationsPage from './pages/MyCreationsPage'
import AboutPage from './pages/AboutPage'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function App() {
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Navbar />
      <Box flex="1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/generator" element={<GeneratorPage />} />
          <Route path="/my-creations" element={<MyCreationsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
  )
}

export default App 