# 🌐 Server Connection Guide

## Overview

Vue Notes now includes a **Jellyfin-style server selection system** that allows you to:
- Connect to self-hosted or remote sync servers
- Switch between multiple servers
- Auto-discover servers on your local network
- Work offline when no server is available

## Features

### 🔌 Server Management
- **Auto-Discovery**: Find servers on your local network automatically
- **Multiple Servers**: Save and switch between different servers
- **Quick Connect**: One-click connection to localhost or custom ports
- **Health Monitoring**: Real-time server status and health checks
- **Offline Mode**: Seamlessly work without a server connection

### 🎨 User Experience
- **First-Run Setup**: Guided server selection on first launch
- **Settings Integration**: Manage servers from the settings panel
- **Connection Status**: Visual indicators for connection state
- **Error Handling**: Clear error messages and troubleshooting

## Usage

### First Time Setup

When you launch Vue Notes for the first time, you'll see the **Server Selector dialog**:

1. **Option 1: Quick Connect**
   - Click "Localhost" to connect to `http://localhost:4444`
   - Or use "Custom Port" to specify a different port

2. **Option 2: Auto-Discover**
   - Click the search icon 🔍 in the URL field
   - Vue Notes will scan for servers on your local network
   - Select a discovered server to connect

3. **Option 3: Manual Entry**
   - Enter your server URL (e.g., `https://notes.example.com`)
   - Optionally give it a friendly name
   - Click "Connect"

4. **Option 4: Offline Mode**
   - Click "Continue in Offline Mode" to use Vue Notes locally
   - Your notes will only be stored on this device

### Managing Servers

#### From Settings Panel

1. Open Settings (gear icon in top-right)
2. Look for the "🌐 Server Sync" section
3. Toggle sync on/off
4. Click "Connect to Server" or "Change Server"

#### Server List

The server selector shows:
- **Saved Servers**: Previously connected servers
- **Discovered Servers**: Auto-discovered local servers
- **Connection Info**: Last connected time, server name, URL

#### Server Actions

- **Connect**: Switch to a different server
- **Remove**: Delete a saved server (trash icon)
- **Disconnect**: Go offline while keeping server saved

### Server Requirements

Your sync server must:
- ✅ Expose a `/health` endpoint returning server info
- ✅ Support CORS for your frontend domain
- ✅ Run the Vue Notes Sync Server v3.0+

Example health response:
```json
{
  "status": "ok",
  "service": "Vue Notes Sync Server",
  "version": "3.0.0",
  "activeRooms": 2,
  "registeredModules": [...],
  "registeredTypes": ["text", "rich-text", "markdown", "code", "image", "smart-layer"],
  "timestamp": "2025-10-05T00:00:00.000Z"
}
```

## Auto-Discovery

### How It Works

The auto-discover feature scans common ports on localhost and local network:

**Scanned Locations:**
- Protocols: `http`, `https`
- Hosts: `localhost`, `127.0.0.1`
- Ports: `4444`, `8080`, `3000`, `4000`

**Discovery Process:**
1. Sends GET request to `/health` endpoint
2. Validates response contains valid server info
3. Adds to discovered servers list
4. Allows one-click connection

### Limitations

- Only scans predefined ports (see list above)
- Doesn't scan entire network subnet
- 5-second timeout per server check
- HTTPS servers need valid certificates

### Custom Discovery

To make your server discoverable:

```bash
# Make sure server is running on a standard port
PORT=4444 node dist/server.js

# Or configure custom port
PORT=8080 node dist/server.js
```

## Connection States

### 🟢 Connected
- Green banner showing server name
- Real-time sync enabled
- All collaboration features available
- Can disconnect or change server

### 🟡 Connecting
- Loading indicator
- Testing server health
- Validating connection

### 🔴 Error
- Red banner with error message
- Common errors:
  - "Failed to fetch" - Server not reachable
  - "Server returned 404" - Invalid endpoint
  - "Network error" - No internet connection
  - "CORS error" - Server not configured for your domain

### ⚫ Offline
- No server connection
- Local-only storage
- All features work except:
  - Real-time collaboration
  - Cross-device sync
  - Multi-user editing

## Configuration

### Settings Store

Server settings are stored in localStorage:

```typescript
{
  syncEnabled: boolean;           // Is sync currently enabled?
  currentServer?: string;         // URL of active server
  servers: ServerConfig[];        // List of saved servers
}

interface ServerConfig {
  url: string;                   // Server URL
  name: string;                  // Friendly name
  lastConnected?: number;        // Timestamp
}
```

### Environment Variables

Configure default server in `.env`:

```bash
# Default server URL (optional)
VITE_DEFAULT_SERVER=http://localhost:4444

# Auto-connect on startup
VITE_AUTO_CONNECT=true
```

## API Integration

### Composable: `useServerConnection()`

```typescript
import { useServerConnection } from '@/composables/useServerConnection';

const {
  state,                    // Connection state
  currentServerConfig,      // Current server config
  savedServers,            // List of saved servers
  connect,                 // Connect to server
  disconnect,              // Disconnect
  reconnect,               // Reconnect to current
  removeServer,            // Remove saved server
  autoDiscover,            // Auto-discover servers
  refreshHealth,           // Refresh health status
} = useServerConnection();
```

### Example: Connect to Server

```typescript
const success = await connect('http://localhost:4444', 'My Server');
if (success) {
  console.log('Connected!');
} else {
  console.error('Connection failed:', state.value.error);
}
```

### Example: Auto-Discover

```typescript
const servers = await autoDiscover();
console.log(`Found ${servers.length} servers`);
servers.forEach(server => {
  console.log(`- ${server.name} at ${server.url}`);
});
```

## Troubleshooting

### Server Not Discovered

**Problem**: Auto-discover doesn't find your server

**Solutions:**
1. Check server is running: `curl http://localhost:4444/health`
2. Verify port matches one of the scanned ports
3. Check firewall isn't blocking the port
4. Use manual entry with full URL

### Connection Fails

**Problem**: "Failed to connect to server" error

**Solutions:**
1. Verify server is running
2. Check URL is correct (including protocol)
3. Test with curl: `curl http://your-server/health`
4. Check CORS settings on server
5. Look at browser console for detailed errors

### CORS Errors

**Problem**: "CORS policy" error in console

**Solution:** Add your frontend URL to server CORS config:

```typescript
// In sync-server/server.ts
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(",") || [
  "http://localhost:5174",
  "http://localhost:5173",
  "https://your-domain.com",  // Add your domain
];
```

### Stuck Connecting

**Problem**: Loading indicator never stops

**Solutions:**
1. Refresh the page
2. Check network tab for failed requests
3. Verify `/health` endpoint is responding
4. Try a different server URL

## Best Practices

### For Users

1. **Save Multiple Servers**: Keep home and work servers for easy switching
2. **Test Connection**: Use Quick Connect to localhost for testing
3. **Offline First**: Don't worry about connectivity - work offline anytime
4. **Name Your Servers**: Give descriptive names to identify them easily

### For Self-Hosters

1. **Use HTTPS**: Always use TLS in production
2. **Configure CORS**: Whitelist your frontend domains
3. **Monitor Health**: Check `/health` endpoint regularly
4. **Standard Port**: Use 4444 for easy discovery
5. **Reverse Proxy**: Use nginx for SSL termination

### For Developers

1. **Error Handling**: Always handle connection errors gracefully
2. **Timeout**: Set reasonable timeouts (5s default)
3. **Retry Logic**: Implement exponential backoff for reconnection
4. **State Management**: Use the provided composable for consistency
5. **Testing**: Test offline mode thoroughly

## Comparison with Jellyfin

| Feature | Jellyfin | Vue Notes |
|---------|----------|-----------|
| Server Selection | ✅ | ✅ |
| Auto-Discovery | ✅ | ✅ |
| Multiple Servers | ✅ | ✅ |
| Offline Mode | ✅ | ✅ |
| Health Monitoring | ✅ | ✅ |
| Quick Connect | ✅ | ✅ |
| Server Management | ✅ | ✅ |

## Future Enhancements

Planned improvements:
- [ ] Server authentication (login required)
- [ ] Server groups/categories
- [ ] Connection quality indicator
- [ ] Automatic reconnection on network restore
- [ ] Server bookmarks/favorites
- [ ] LAN mDNS discovery
- [ ] QR code server sharing
- [ ] Server migration tool

---

**Status**: ✅ Implemented
**Version**: 1.0.0
**Date**: October 5, 2025
