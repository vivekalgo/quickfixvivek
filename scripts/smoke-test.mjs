import { spawn, execSync } from 'node:child_process'

const STARTUP_TIMEOUT_MS = 120000
const SHUTDOWN_GRACE_MS = 1500

const APPS = [
  {
    name: 'admin',
    workspace: 'apps/admin',
    baseUrl: 'http://127.0.0.1:3002',
    routes: ['/'],
  },
  {
    name: 'customer',
    workspace: 'apps/customer',
    baseUrl: 'http://127.0.0.1:3000',
    routes: ['/', '/login', '/orders', '/profile'],
  },
  {
    name: 'provider',
    workspace: 'apps/provider',
    baseUrl: 'http://127.0.0.1:3001',
    routes: ['/'],
  },
]

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: 'manual' })
      if (response.status >= 200 && response.status < 500) {
        return
      }
    } catch {
      // Keep polling until timeout.
    }

    await sleep(1000)
  }

  throw new Error(`Timed out waiting for server: ${url}`)
}

async function verifyRoutes(baseUrl, routes) {
  for (const route of routes) {
    const url = `${baseUrl}${route}`
    const response = await fetch(url, { redirect: 'manual' })

    if (response.status >= 400) {
      throw new Error(`Smoke test failed for ${url} with HTTP ${response.status}`)
    }

    console.log(`[smoke] OK ${url} -> ${response.status}`)
  }
}

function spawnStart(workspace) {
  const child = spawn(`${npmCommand()} run start --workspace=${workspace}`, [], {
    stdio: 'pipe',
    shell: true,
    env: process.env,
  })

  child.stdout.on('data', chunk => process.stdout.write(`[start:${workspace}] ${chunk}`))
  child.stderr.on('data', chunk => process.stderr.write(`[start:${workspace}] ${chunk}`))

  return child
}

function stopChild(child) {
  if (!child || child.killed) {
    return
  }

  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' })
    } catch {
      // Ignore cleanup failures.
    }
    return
  }

  child.kill('SIGTERM')
}

async function run() {
  const children = []

  try {
    for (const app of APPS) {
      console.log(`[smoke] starting ${app.name} (${app.workspace})`)
      const child = spawnStart(app.workspace)
      children.push(child)

      await waitForServer(app.baseUrl, STARTUP_TIMEOUT_MS)
      await verifyRoutes(app.baseUrl, app.routes)
      console.log(`[smoke] ${app.name} healthy`)
    }

    console.log('[smoke] all apps passed')
  } catch (error) {
    console.error(`[smoke] failure: ${error.message}`)
    process.exitCode = 1
  } finally {
    for (const child of children.reverse()) {
      stopChild(child)
    }

    await sleep(SHUTDOWN_GRACE_MS)
  }
}

run()
