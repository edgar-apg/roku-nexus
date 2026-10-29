from __future__ import annotations

import argparse
import ipaddress
import json
import os
import secrets
import socket
import string
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


PAGE = r'''<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#111827"><title>Control Roku local</title>
  <style>
    :root{color-scheme:dark;--bg:#0b1020;--panel:#151d30;--line:#2b3852;--muted:#a7b3c8;--accent:#6ee7b7;--danger:#fca5a5}
    *{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at top,#182541,var(--bg) 65%);color:#f4f7fb;font:16px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;min-height:100vh}
    main{width:min(100% - 28px,510px);margin:0 auto;padding:28px 0 36px}h1{font-size:1.55rem;margin:0 0 4px}.sub,.hint{color:var(--muted);font-size:.9rem}.card{background:#151d30ed;border:1px solid var(--line);border-radius:18px;padding:18px;margin-top:16px;box-shadow:0 12px 40px #0003}
    label{display:block;font-size:.9rem;color:#d8e1ef;margin:0 0 6px}input,button{font:inherit;border-radius:12px}input{width:100%;border:1px solid #40506d;background:#0b1222;color:#fff;padding:12px}button{border:1px solid #3b4b68;background:#202b40;color:#f5f8fc;padding:12px;cursor:pointer;touch-action:manipulation;user-select:none}button:hover{background:#2a3954}button:active{transform:scale(.98)}button:disabled{opacity:.45;cursor:not-allowed}.primary{background:#047857;border-color:#059669}.primary:hover{background:#059669}.row{display:flex;gap:9px;align-items:center}.row>*{flex:1;min-width:0}.stack{display:grid;gap:11px}.devices{display:flex;gap:8px;overflow:auto;margin-top:12px}.device{white-space:nowrap;flex:0 0 auto}.device.active{border-color:var(--accent);color:var(--accent)}.status{min-height:1.4em;color:var(--muted);font-size:.9rem;margin-top:9px}.status.error{color:var(--danger)}.name{font-weight:650}.remote{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;max-width:290px;margin:14px auto}.remote button{min-height:58px;font-size:1.1rem}.remote .blank{visibility:hidden}.round{border-radius:50%;aspect-ratio:1;min-height:auto!important;font-size:1.35rem!important}.wide{display:grid;grid-template-columns:1fr 1fr;gap:10px}.small{padding:9px;font-size:.9rem}.hidden{display:none!important}.foot{margin-top:20px;color:var(--muted);font-size:.82rem}.foot a{color:#9ddbc8}.badge{font-size:.78rem;color:var(--accent);margin-left:8px}
    @media(max-width:370px){main{width:min(100% - 20px,510px);padding-top:18px}.card{padding:14px}.remote button{min-height:52px}}
  </style>
</head>
<body><main>
  <header><h1>Control Roku local</h1><div class="sub">Un control remoto para dispositivos Roku compatibles con ECP</div></header>
  <section id="login" class="card stack">
    <div><strong>Conectar</strong><div class="hint">Ingresa la contraseña que aparece en la ventana de Python de tu PC.</div></div>
    <label for="password">Contraseña de esta sesión</label><input id="password" type="password" autocomplete="current-password" placeholder="Contraseña temporal">
    <button id="loginBtn" class="primary">Entrar</button><div id="loginStatus" class="status" role="status"></div>
  </section>
  <section id="app" class="hidden">
    <div class="card">
      <div class="row"><div><strong>Dispositivo</strong><div class="hint">La lista se guarda solo en este navegador.</div></div><button id="scan" class="small">Buscar</button></div>
      <div class="row" style="margin-top:12px"><div><label for="ip">Dirección IP de Roku</label><input id="ip" inputmode="decimal" placeholder="192.168.1.50"></div><button id="connect" class="primary" style="flex:0 0 auto;align-self:end">Conectar</button></div>
      <div id="devices" class="devices"></div><div id="deviceStatus" class="status" role="status"></div>
    </div>
    <div id="remoteCard" class="card hidden">
      <div><span id="deviceName" class="name">Roku</span><span id="deviceType" class="badge"></span></div>
      <div class="remote" aria-label="Navegación Roku">
        <span class="blank"></span><button data-key="Up" aria-label="Arriba">▲</button><span class="blank"></span>
        <button data-key="Left" aria-label="Izquierda">◀</button><button data-key="Select" class="round" aria-label="Seleccionar">OK</button><button data-key="Right" aria-label="Derecha">▶</button>
        <span class="blank"></span><button data-key="Down" aria-label="Abajo">▼</button><span class="blank"></span>
      </div>
      <div class="wide"><button data-key="Back">↩ Atrás</button><button data-key="Home">⌂ Inicio</button><button data-key="Rev">⏪ Retroceder</button><button data-key="Fwd">⏩ Avanzar</button><button data-key="Play">⏯ Reproducir / pausar</button><button data-key="InstantReplay">⟲ Repetición</button></div>
      <div id="tvControls" class="wide" style="margin-top:10px"><button data-key="VolumeDown">− Volumen</button><button data-key="VolumeUp">+ Volumen</button><button data-key="VolumeMute">◖ Silenciar</button><button data-key="PowerOff">⏻ Encendido</button></div>
      <details style="margin-top:14px"><summary>Aplicaciones instaladas</summary><div id="channels" class="stack" style="margin-top:10px"></div></details>
      <div id="remoteStatus" class="status" role="status"></div>
    </div>
  </section>
  <p class="foot">Solo funciona dentro de tu red local. Roku usa HTTP en la red; evita redes públicas y no abras puertos del router. <a href="https://developer.roku.com/dev/docs/external-control-api" target="_blank" rel="noopener">Acerca de ECP</a></p>
</main>
<script>
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];let selected='';let known=JSON.parse(localStorage.getItem('rokuDevices')||'[]');
async function api(path,data){const r=await fetch(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,credentials:'same-origin'});const j=await r.json().catch(()=>({error:'Respuesta inválida'}));if(!r.ok)throw Error(j.error||'Error de conexión');return j}
function status(el,msg,bad=false){el.textContent=msg;el.classList.toggle('error',bad)}
function drawDevices(){const box=$('#devices');box.replaceChildren();known.forEach(d=>{const b=document.createElement('button');b.textContent=d.name||d.ip;b.className='device small'+(selected===d.ip?' active':'');b.onclick=()=>{$('#ip').value=d.ip;connect()};box.append(b)})}
function save(d){known=[d,...known.filter(x=>x.ip!==d.ip)].slice(0,8);localStorage.setItem('rokuDevices',JSON.stringify(known));drawDevices()}
async function login(){status($('#loginStatus'),'Conectando…');try{await api('/api/login',{password:$('#password').value});$('#login').classList.add('hidden');$('#app').classList.remove('hidden');drawDevices()}catch(e){status($('#loginStatus'),e.message,true)}}
async function connect(){const ip=$('#ip').value.trim();status($('#deviceStatus'),'Consultando Roku…');try{const d=await api('/api/connect',{ip});selected=ip;$('#remoteCard').classList.remove('hidden');$('#deviceName').textContent=d.name||'Roku';$('#deviceType').textContent=d.model||'';const tv=d.tv===true;$('#tvControls').classList.toggle('hidden',!tv);status($('#deviceStatus'),'Conectado · '+ip);save({ip,name:d.name||ip});loadApps();$$('.device').forEach(b=>b.classList.toggle('active',b.textContent===(d.name||ip)))}catch(e){status($('#deviceStatus'),e.message,true)}}
async function press(key){if(!selected)return;try{await api('/api/key',{ip:selected,key});status($('#remoteStatus'),'Enviado: '+key)}catch(e){status($('#remoteStatus'),e.message,true)}}
async function loadApps(){try{const data=await api('/api/apps?ip='+encodeURIComponent(selected));const box=$('#channels');box.replaceChildren();data.apps.forEach(a=>{const b=document.createElement('button');b.className='small';b.textContent=a.name;b.onclick=async()=>{try{await api('/api/launch',{ip:selected,id:a.id});status($('#remoteStatus'),'Abriendo '+a.name)}catch(e){status($('#remoteStatus'),e.message,true)}};box.append(b)});if(!data.apps.length)box.textContent='No se pudieron leer las aplicaciones.'}catch(_){}}
$('#loginBtn').onclick=login;$('#password').onkeydown=e=>{if(e.key==='Enter')login()};$('#connect').onclick=connect;$('#ip').onkeydown=e=>{if(e.key==='Enter')connect()};$$('[data-key]').forEach(b=>b.onclick=()=>press(b.dataset.key));
$('#scan').onclick=async()=>{status($('#deviceStatus'),'Buscando en la red local…');try{const d=await api('/api/discover',{ });d.devices.forEach(x=>save({ip:x.ip,name:x.name||x.ip}));status($('#deviceStatus'),d.devices.length?`Encontrados: ${d.devices.length}`:'No encontrados. Prueba ingresando la IP manualmente.')}catch(e){status($('#deviceStatus'),e.message,true)}};
api('/api/session').then(()=>{$('#login').classList.add('hidden');$('#app').classList.remove('hidden');drawDevices()}).catch(()=>{});
</script></body></html>'''


KEYS = {
    "Home", "Rev", "Fwd", "Play", "Select", "Left", "Right", "Down", "Up", "Back",
    "InstantReplay", "Info", "Backspace", "Enter", "VolumeDown", "VolumeMute", "VolumeUp",
    "PowerOff", "ChannelUp", "ChannelDown", "InputTuner", "InputHDMI1", "InputHDMI2",
    "InputHDMI3", "InputHDMI4", "InputAV1",
}


def roku_ip(value: str) -> str:
    try:
        addr = ipaddress.ip_address(value)
    except ValueError as exc:
        raise ValueError("Escribe una dirección IPv4 válida de tu Roku.") from exc
    if addr.version != 4 or not addr.is_private or addr.is_loopback or addr.is_link_local:
        raise ValueError("Por seguridad, solo se aceptan direcciones IPv4 privadas de la red local.")
    return str(addr)


def roku_request(ip: str, path: str, method: str = "GET", timeout: float = 2.5) -> bytes:
    url = f"http://{roku_ip(ip)}:8060/{path.lstrip('/')}"
    req = urllib.request.Request(url, method=method, data=b"" if method == "POST" else None)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read(1_000_000)
    except urllib.error.HTTPError as exc:
        if exc.code in (401, 403):
            raise RuntimeError("Roku rechazó el control. Revisa el ajuste de acceso de red en Roku.") from exc
        raise RuntimeError(f"Roku respondió con error HTTP {exc.code}.") from exc
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        raise RuntimeError("No se pudo conectar. Verifica IP, red Wi-Fi y que Roku acepte control por red.") from exc


def xml_children(data: bytes) -> dict[str, str]:
    root = ET.fromstring(data)
    return {child.tag.rsplit("}", 1)[-1].lower(): (child.text or "").strip() for child in root}


def device_info(ip: str) -> dict:
    info = xml_children(roku_request(ip, "query/device-info"))
    is_tv = info.get("is-tv", "false").lower() == "true"
    # Roku OS 15+ reports TV controls directly; older Roku TVs use is-tv.
    supports_tv_power = info.get("supports-tv-power-control", "").lower() == "true"
    supports_volume = info.get("supports-audio-volume-control", "").lower() == "true"
    return {
        "ip": ip,
        "name": info.get("user-device-name") or info.get("friendly-device-name") or info.get("model-name") or "Roku",
        "model": info.get("model-name", ""),
        "tv": is_tv or supports_tv_power or supports_volume,
    }


def discover() -> list[dict]:
    request = ("M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\n"
               'MAN: "ssdp:discover"\r\nMX: 2\r\nST: roku:ecp\r\n\r\n').encode()
    found: dict[str, dict] = {}
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)
    sock.settimeout(0.35)
    try:
        sock.sendto(request, ("239.255.255.250", 1900))
        deadline = time.monotonic() + 2.4
        while time.monotonic() < deadline:
            try:
                data, _ = sock.recvfrom(4096)
            except socket.timeout:
                continue
            headers = {}
            for line in data.decode("utf-8", "ignore").splitlines()[1:]:
                if ":" in line:
                    k, v = line.split(":", 1)
                    headers[k.strip().lower()] = v.strip()
            location = headers.get("location", "")
            try:
                ip = roku_ip(urllib.parse.urlparse(location).hostname or "")
                found[ip] = {"ip": ip, "name": ip}
            except ValueError:
                continue
    finally:
        sock.close()
    results = []
    for ip in found:
        try:
            results.append(device_info(ip))
        except (RuntimeError, ET.ParseError):
            results.append(found[ip])
    return results


class Server(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class Handler(BaseHTTPRequestHandler):
    server_version = "RokuRemote/1.0"
    sessions: dict[str, float] = {}
    login_attempts: dict[str, tuple[int, float]] = {}
    state_lock = threading.Lock()

    def log_message(self, fmt, *args):
        # Avoid writing credentials, URLs, or user input into routine console logs.
        return

    def send_json(self, status: int, payload: dict, extra_headers: dict | None = None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        for key, value in (extra_headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def body_json(self) -> dict:
        length = min(int(self.headers.get("Content-Length", "0")), 8192)
        try:
            return json.loads(self.rfile.read(length) or b"{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise ValueError("La solicitud no tiene un formato válido.")

    def authenticated(self) -> bool:
        cookie = self.headers.get("Cookie", "")
        sid = next((x.partition("=")[2] for x in cookie.split(";") if x.strip().startswith("roku_session=")), "")
        with self.state_lock:
            expiry = self.sessions.get(sid, 0)
            if expiry > time.time():
                return True
            self.sessions.pop(sid, None)
        return False

    def do_GET(self):
        parsed = urllib.parse.urlsplit(self.path)
        if parsed.path == "/":
            body = PAGE.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
            self.end_headers()
            self.wfile.write(body)
            return
        if parsed.path == "/api/session":
            return self.send_json(200 if self.authenticated() else 401, {"ok": self.authenticated()})
        if parsed.path.startswith("/api/") and not self.authenticated():
            return self.send_json(401, {"error": "Inicia sesión para continuar."})
        try:
            if parsed.path == "/api/apps":
                query = urllib.parse.parse_qs(parsed.query)
                ip = roku_ip(query.get("ip", [""])[0])
                root = ET.fromstring(roku_request(ip, "query/apps"))
                apps = []
                for app in root:
                    try:
                        app_id = str(int(app.attrib.get("id", "")))
                    except ValueError:
                        continue
                    apps.append({"id": app_id, "name": (app.text or "Roku app").strip()})
                return self.send_json(200, {"apps": apps})
            return self.send_json(404, {"error": "No existe esa ruta."})
        except (ValueError, RuntimeError, ET.ParseError) as exc:
            return self.send_json(400, {"error": str(exc)})

    def do_POST(self):
        parsed = urllib.parse.urlsplit(self.path)
        try:
            data = self.body_json()
            if parsed.path == "/api/login":
                client = self.client_address[0]
                with self.state_lock:
                    count, until = self.login_attempts.get(client, (0, 0))
                    if until > time.time():
                        return self.send_json(429, {"error": "Demasiados intentos. Espera un minuto."})
                    if not secrets.compare_digest(str(data.get("password", "")), self.server.password):
                        count += 1
                        self.login_attempts[client] = (count, time.time() + 60 if count >= 8 else 0)
                        return self.send_json(401, {"error": "Contraseña incorrecta."})
                    self.login_attempts.pop(client, None)
                    sid = secrets.token_urlsafe(32)
                    self.sessions[sid] = time.time() + 12 * 60 * 60
                return self.send_json(200, {"ok": True}, {"Set-Cookie": f"roku_session={sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200"})
            if parsed.path.startswith("/api/") and not self.authenticated():
                return self.send_json(401, {"error": "Inicia sesión para continuar."})
            if parsed.path != "/api/login":
                origin = self.headers.get("Origin")
                if origin:
                    expected = f"http://{self.headers.get('Host', '')}"
                    if origin.rstrip("/") != expected:
                        return self.send_json(403, {"error": "Origen no permitido."})
            if parsed.path == "/api/connect":
                ip = roku_ip(str(data.get("ip", "")))
                return self.send_json(200, device_info(ip))
            if parsed.path == "/api/discover":
                return self.send_json(200, {"devices": discover()})
            if parsed.path == "/api/key":
                ip = roku_ip(str(data.get("ip", "")))
                key = str(data.get("key", ""))
                if key not in KEYS:
                    raise ValueError("Ese botón no está permitido.")
                roku_request(ip, f"keypress/{urllib.parse.quote(key, safe='')}", "POST")
                return self.send_json(200, {"ok": True})
            if parsed.path == "/api/launch":
                ip = roku_ip(str(data.get("ip", "")))
                app_id = str(int(data.get("id", "")))
                roku_request(ip, f"launch/{app_id}", "POST")
                return self.send_json(200, {"ok": True})
            return self.send_json(404, {"error": "No existe esa ruta."})
        except (ValueError, RuntimeError, ET.ParseError, TypeError) as exc:
            return self.send_json(400, {"error": str(exc)})


def main():
    parser = argparse.ArgumentParser(description="Control Roku local para PC y celular")
    parser.add_argument("--host", default="0.0.0.0", help="Interfaz de red (predeterminado: todas las interfaces locales)")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    password = os.environ.get("ROKU_REMOTE_PASSWORD") or "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
    server = Server((args.host, args.port), Handler)
    server.password = password
    print("Control Roku local está activo. Cierra esta ventana para detenerlo.")
    print(f"En esta PC: http://127.0.0.1:{args.port}")
    if args.host in ("0.0.0.0", ""):
        try:
            host_name = socket.gethostname()
            for item in socket.getaddrinfo(host_name, None, socket.AF_INET, socket.SOCK_STREAM):
                ip = item[4][0]
                if ipaddress.ip_address(ip).is_private and not ip.startswith("127."):
                    print(f"Desde celular en la misma Wi-Fi: http://{ip}:{args.port}")
        except OSError:
            pass
    print(f"Contraseña temporal: {password}")
    print("No compartas la contraseña ni abras este servicio a Internet.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nCerrando control Roku local…")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
