import './utils/installVpsFetch'
import './style.css'
import { initApp } from './app/bootstrap'
import { startSyncPolling } from './app/statusBar'
import { setupDashboard } from './ui/dashboard'

initApp()
startSyncPolling()
setupDashboard()
