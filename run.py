import os
import socket
import sys
import urllib.request
import uvicorn
from app.config import settings

# Ensure UTF-8 output on Windows consoles to prevent UnicodeEncodeError
if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def get_local_ip():
    """Finds the local network IPv4 address for LAN/Mobile access."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Doesn't need to be reachable, just triggers routing table lookup
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Checks if a given TCP port is already open/occupied."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0

def find_available_port(start_port: int, max_attempts: int = 10) -> int:
    """Finds the next free available port."""
    for p in range(start_port, start_port + max_attempts):
        if not is_port_in_use(p):
            return p
    return start_port

def main():
    local_ip = get_local_ip()
    preferred_port = settings.PORT
    host = "0.0.0.0"

    # Check if preferred port is already running CivicNexus / ImpactBridge
    if is_port_in_use(preferred_port):
        try:
            req = urllib.request.Request(f"http://127.0.0.1:{preferred_port}/api/network-info", headers={"User-Agent": "CivicNexusCLI"})
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    print("=" * 70)
                    print("   [+] CIVICNEXUS IS ALREADY RUNNING & ACTIVE!")
                    print("=" * 70)
                    print(f"   [+] Local URL:   http://localhost:{preferred_port}")
                    print(f"   [+] Mobile URL:  http://{local_ip}:{preferred_port}")
                    print("=" * 70)
                    print(f"   The server is already running on port {preferred_port}.")
                    print(f"   You can open http://localhost:{preferred_port} in your browser now!")
                    print("=" * 70)
                    return
        except Exception:
            pass

        # If occupied by another process, auto-fallback to next open port
        port = find_available_port(preferred_port + 1)
        print(f"[*] Port {preferred_port} is busy. Automatically switching to free port: {port}")
    else:
        port = preferred_port

    print("=" * 70)
    print("   CIVICNEXUS: Digital Innovation Ecosystem & Mobile Portal")
    print("=" * 70)
    print("   [+] LOCAL / LAPTOP ACCESS:")
    print(f"       http://localhost:{port}")
    print(f"       http://127.0.0.1:{port}")
    print("")
    print("   [+] MOBILE ACCESS (Same Wi-Fi / Hotspot):")
    print(f"       http://{local_ip}:{port}")
    print("=" * 70)
    print(f"   Tip: Open http://localhost:{port} in your browser (Chrome/Edge/Safari)")
    print("   Camera & GPS access enabled for both Laptop & Mobile!")
    print("=" * 70)
    print("")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )

if __name__ == "__main__":
    main()



