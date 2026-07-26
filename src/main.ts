import './utils/installVpsFetch'
import './style.css'
import { initApp } from './app/bootstrap'
import { startSyncPolling } from './app/statusBar'
import { setupDashboard } from './ui/dashboard'
import { getSharedMemoryManager } from './Director/MemoryManager'

initApp()
// Both wire up before initApp()'s async body has constructed MemoryManager, so they
// read it through the shared-instance accessor (populated once bootstrap finishes)
// rather than a parameter that doesn't exist yet.
startSyncPolling(getSharedMemoryManager)
setupDashboard(getSharedMemoryManager)
