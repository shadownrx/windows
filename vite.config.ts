import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Custom plugin to bridge OS processes
const processBridge = () => ({
  name: 'process-bridge',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url === '/api/pc-processes') {
        try {
          const psCommand = `powershell -Command "Get-Process | Select-Object Id, ProcessName, @{Name='CPU';Expression={($_.CPU -as [double])}}, @{Name='Mem';Expression={($_.WorkingSet64 / 1MB)}} | ConvertTo-Json"`
          const { stdout } = await execAsync(psCommand, { maxBuffer: 1024 * 1024 * 10 })
          res.setHeader('Content-Type', 'application/json')
          res.end(stdout)
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Failed' }))
        }
        return
      }

      if (req.url === '/api/pc-system') {
        try {
          // Get Hardware Specs: CPU Model, Total RAM, GPU
          const hardwareCmd = `powershell -Command \"$cpu = Get-CimInstance Win32_Processor | Select-Object Name, NumberOfLogicalProcessors; $os = Get-CimInstance Win32_OperatingSystem | Select-Object TotalVisibleMemorySize, FreePhysicalMemory; $gpu = Get-CimInstance Win32_VideoController | Select-Object Name; @{cpu=$cpu; ram=$os; gpu=$gpu} | ConvertTo-Json\"`
          const { stdout } = await execAsync(hardwareCmd)
          res.setHeader('Content-Type', 'application/json')
          res.end(stdout)
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Hardware fetch failed' }))
        }
        return
      }
      if (req.url === '/api/pc-services') {
        try {
          const psCommand = `powershell -Command "Get-Service | Select-Object Name, Status, DisplayName | ConvertTo-Json"`
          const { stdout } = await execAsync(psCommand, { maxBuffer: 1024 * 1024 * 5 })
          res.setHeader('Content-Type', 'application/json')
          res.end(stdout)
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Services failed' }))
        }
        return
      }

      if (req.url === '/api/pc-startup') {
        try {
          const psCommand = `powershell -Command "Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, User | ConvertTo-Json"`
          const { stdout } = await execAsync(psCommand)
          res.setHeader('Content-Type', 'application/json')
          res.end(stdout || '[]')
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Startup failed' }))
        }
        return
      }

      next()
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), processBridge()],
})
