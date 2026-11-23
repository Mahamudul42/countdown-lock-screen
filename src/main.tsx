import { createRoot } from 'react-dom/client'
import '@fontsource/instrument-sans/latin-400.css'
import '@fontsource/instrument-sans/latin-500.css'
import '@fontsource/instrument-sans/latin-600.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(<App />)
