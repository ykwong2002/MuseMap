import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import CssBaseline from '@mui/material/CssBaseline';
import { CompositionPage } from './pages/CompositionPage';
import { ErrorBoundary } from './components/ErrorBoundary';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <SnackbarProvider 
          maxSnack={3} 
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <CssBaseline />
          <Router>
            <Routes>
              <Route path="/" element={<CompositionPage />} />
            </Routes>
          </Router>
        </SnackbarProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
