import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import { Provider } from 'react-redux'
import store from './store/store.js'

// --- ADD THIS ---
import axios from 'axios'

// Make axios send cookies with every request (important for auth)
axios.defaults.withCredentials = true
// --- END ADDITION ---

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
)
