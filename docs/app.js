(() => {
  const $ = selector => document.querySelector(selector);
  const ipInput = $('#roku-ip');
  const prefixInput = $('#network-prefix');
  const connectButton = $('#connect-button');
  const scanButton = $('#scan-button');
  const statusBox = $('#connection-status');
  const scanStatus = $('#scan-status');
  const scanResults = $('#scan-results');
  const scanProgress = $('#scan-progress');
  const recovery = $('#recovery');
  const remoteStatus = $('#remote-status');
  const settingsPanel = $('#settings-panel');
  const settingsToggle = $('#settings-toggle');
  const permissionDialog = $('#permission-dialog');
  const keyboardDialog = $('#keyboard-dialog');
  const textInput = $('#roku-text');
  const keyboardStatus = $('#keyboard-status');
  const keys = new Set(['Up','Down','Left','Right','Select','Home','Back','Info','Rev','Fwd','Play','InstantReplay','VolumeDown','VolumeUp','VolumeMute','PowerOff','Enter']);
  const fallbackAppIds = { netflix:'12', youtube:'837', disney:'291097', spotify:'19977', prime:'13', hbo:'61322' };
  const appIdsByDevice = new Map();
  let connectedIp = '';
  let connectedName = '';
  const discoveredNames = new Map();
  let permissionState = 'unknown';
  let pendingAction = 'connect';
  let pendingKey = '';
  let pendingApp = '';

  const words = {
    es: {
      language:'Idioma', eyebrow:'CONTROL REMOTO EN TU NAVEGADOR', headline:'Roku Nexus', intro:'El control de tu Roku, directamente desde el navegador.', metaDescription:'Roku Nexus: controla tu Roku desde el navegador, directamente en tu red local.', readmeButton:'README', help:'Ayuda', appsTitle:'Aplicaciones', appNetflix:'Netflix', appYouTube:'YouTube', appDisney:'Disney+', appSpotify:'Spotify', appPrime:'Amazon Prime Video', appHbo:'HBO Max',
      setupTitle:'Prepara tu Roku', setupSub:'Ambos dispositivos deben estar en la misma red Wi‑Fi.', rokuSettingsTitle:'Cómo permitir el control por red',
      rokuStep1:'En Roku, abre Configuración → Sistema → Configuración avanzada del sistema.', rokuStep2:'Entra en Control por aplicaciones móviles → Acceso a la red.', rokuStep3:'Selecciona Habilitado. El nombre del menú puede variar según la versión.', rokuVersion:'Desde Roku OS 14.1, este permiso debe estar habilitado para aceptar los botones del control.',
      connectTitle:'Conecta tu dispositivo', connectSub:'Escribe la dirección IP de tu Roku o búscala en tu red.', scanTitle:'Buscar Roku en mi red',
      scanExplain:'El navegador no puede hacer el descubrimiento SSDP de la aplicación de PC. Puedes buscar el rango local de 254 direcciones; escribe los primeros tres números de una IP de tu Wi‑Fi.', prefixLabel:'Rango de red', prefixPlaceholder:'192.168.1', scanButton:'Buscar',
      scanHelp:'Ejemplo: si la IP de tu celular es 192.168.1.23, escribe 192.168.1.', orEnter:'O escribe la IP manualmente', ipLabel:'Dirección IP de Roku', ipPlaceholder:'Ejemplo: 192.168.1.25', connectButton:'Conectar',
      ipHelp:'Encuéntrala en Roku: Configuración → Red → Acerca de.', permissionNote:'Al conectar o buscar, tu navegador puede pedir permiso para acceder a dispositivos de tu red local.',
      blockedTitle:'¿Bloqueaste el acceso local?', blockedStep1:'Abre los ajustes del sitio desde el icono junto a la dirección de esta página.', blockedStep2:'Busca Red local y selecciona Permitir. En Chrome, el atajo de ajustes de abajo abre esta configuración.', blockedStep3:'Regresa aquí y toca Volver a intentar.',
      retryButton:'Volver a intentar', settingsHelp:'Si el atajo no abre, copia la dirección y pégala en la barra. En Edge, usa los ajustes del sitio desde el icono de la barra.', copyButton:'Copiar', copied:'Copiado', copyFallback:'Copia la dirección',
      selectedDevice:'CONTROL REMOTO', settings:'Configuración', noDevice:'Abre ⚙ para buscar o conectar tu Roku.', savedIpReady:'IP guardada: {ip}. Pulsa un botón para probar el control.', navigation:'Navegación', up:'Arriba', down:'Abajo', left:'Izquierda', right:'Derecha', select:'Seleccionar',
      back:'Atrás', options:'Asterisco / opciones', home:'Home', topControls:'Atrás y Home', secondaryControls:'Repetición y opciones', playback:'Reproducción', rewind:'Retroceder', fastForward:'Adelantar', playPause:'Reproducir o pausar', typeLabel:'Escribir en Roku', keyboardEyebrow:'TECLADO DE ROKU', typePlaceholder:'Escribe aquí…', typeHelp:'Lo que escribas y borres aquí se enviará al campo activo de Roku.', openKeyboard:'Abrir teclado', closeDialog:'Cerrar teclado', deleteCharacter:'Borrar carácter', enterButton:'Entrar', enterSent:'Comando Entrar enviado a Roku.',
      volumePower:'Volumen y encendido', modelControls:'Estos botones dependen del modelo Roku y del televisor conectado.', volumeDown:'− Volumen', volumeUp:'+ Volumen', mute:'Silenciar', power:'⏻ Encendido',
      privacy:'Los comandos van desde tu navegador directamente a la Roku en tu red. Este sitio no necesita tu cuenta Roku ni envía la IP a un servidor.', ecpLink:'Cómo funciona el control ECP de Roku', securityStep:'UN PASO DE SEGURIDAD', allowNetwork:'Permite el acceso a la red local', permissionDialog:'Tu Roku está en tu Wi‑Fi. El navegador necesita tu permiso para que esta página pueda enviarle comandos.', permissionContinue:'Entendido, continuar', notNow:'Ahora no',
      invalidIp:'Escribe una IP privada válida (por ejemplo, 192.168.1.25).', invalidPrefix:'Escribe los primeros tres bloques de una IP privada (por ejemplo, 192.168.1).',
      blocked:'El navegador tiene bloqueado el acceso a la red local.', scanBlocked:'Permite el acceso a la red local para buscar dispositivos.', scanning:'Buscando dispositivos que respondan en el puerto Roku ECP…', scanProgress:'Revisadas {done} de 254 direcciones…', noCandidates:'No hubo respuestas. Revisa el rango, la red y el permiso; también puedes escribir la IP manualmente.',
      candidates:'Posibles dispositivos ({count}). Toca uno para seleccionarlo y luego pulsa Conectar.', lookingNames:'Consultando los nombres disponibles…', candidate:'Usar {ip}', unnamed:'Roku posible', scanError:'La búsqueda no pudo acceder a la red local. Revisa el permiso del navegador o escribe la IP manualmente.',
      sendingHome:'Solicitando permiso y enviando Inicio…', sentHome:'Solicitud enviada a {ip}. Mira la TV: si aparece la pantalla de inicio, ya está conectado.', remoteReady:'Listo para enviar botones. Por privacidad del navegador, no podemos leer la respuesta de Roku; confirma mirando la TV.',
      sendError:'No se pudo enviar el comando. Revisa el permiso local, la IP y que Roku permita el control por red.', keySent:'Botón {key} enviado. La respuesta depende del modelo Roku.', keyError:'No se pudo enviar. Comprueba la conexión de red del dispositivo.', launchingApp:'Solicitando abrir {app}…', appRequested:'Solicitud para abrir {app} enviada. Roku necesita tener esa aplicación disponible.',
      scanPermission:'Para buscar en tu red, el navegador necesita permiso de acceso local.', home:'Inicio', rokuName:'Roku',
    },
    en: {
      language:'Language', eyebrow:'REMOTE CONTROL IN YOUR BROWSER', headline:'Roku Nexus', intro:'Your Roku remote, right in your browser.', metaDescription:'Roku Nexus: control your Roku from your browser over your local network.', readmeButton:'README', help:'Help', appsTitle:'Apps', appNetflix:'Netflix', appYouTube:'YouTube', appDisney:'Disney+', appSpotify:'Spotify', appPrime:'Amazon Prime Video', appHbo:'HBO Max',
      setupTitle:'Get your Roku ready', setupSub:'Your Roku and this device must be on the same Wi‑Fi network.', rokuSettingsTitle:'Allow network control',
      rokuStep1:'On Roku, open Settings → System → Advanced system settings.', rokuStep2:'Open Control by mobile apps → Network access.', rokuStep3:'Choose Enabled. Menu names may vary by software version.', rokuVersion:'Starting with Roku OS 14.1, this setting must be enabled to receive remote button commands.',
      connectTitle:'Connect your device', connectSub:'Enter your Roku IP address or search your network.', scanTitle:'Find Roku devices on my network',
      scanExplain:'A browser cannot perform the SSDP discovery used by the PC app. You can scan 254 local addresses instead; enter the first three numbers of an IP on your Wi‑Fi.', prefixLabel:'Network range', prefixPlaceholder:'192.168.1', scanButton:'Scan',
      scanHelp:'Example: if your phone IP is 192.168.1.23, enter 192.168.1.', orEnter:'Or enter the IP address manually', ipLabel:'Roku IP address', ipPlaceholder:'Example: 192.168.1.25', connectButton:'Connect',
      ipHelp:'Find it on Roku: Settings → Network → About.', permissionNote:'When connecting or searching, your browser may ask permission to access devices on your local network.',
      blockedTitle:'Was local access blocked?', blockedStep1:'Open this site’s settings using the icon next to the page address.', blockedStep2:'Find Local network and choose Allow. In Chrome, the settings shortcut below opens this site’s settings.', blockedStep3:'Return here and tap Try again.',
      retryButton:'Try again', settingsHelp:'If the shortcut does not open, copy the address and paste it in the browser bar. In Edge, use site settings from the address bar icon.', copyButton:'Copy', copied:'Copied', copyFallback:'Copy the address',
      selectedDevice:'REMOTE CONTROL', settings:'Settings', noDevice:'Open ⚙ to find or connect your Roku.', savedIpReady:'Saved IP: {ip}. Tap a button to try the remote.', navigation:'Navigation', up:'Up', down:'Down', left:'Left', right:'Right', select:'Select',
      back:'Back', options:'Asterisk / options', home:'Home', topControls:'Back and Home', secondaryControls:'Replay and options', playback:'Playback', rewind:'Rewind', fastForward:'Fast forward', playPause:'Play or pause', typeLabel:'Type on Roku', keyboardEyebrow:'ROKU KEYBOARD', typePlaceholder:'Type here…', typeHelp:'Text you type or delete here is sent to Roku’s active text field.', openKeyboard:'Open keyboard', closeDialog:'Close keyboard', deleteCharacter:'Delete character', enterButton:'Enter', enterSent:'Enter command sent to Roku.', replay:'Instant replay', volumePower:'Volume and power', modelControls:'These buttons depend on your Roku model and connected TV.', volumeDown:'− Volume', volumeUp:'+ Volume', mute:'Mute', power:'⏻ Power',
      privacy:'Commands go directly from your browser to the Roku on your network. This site does not need your Roku account or send the IP address to a server.', ecpLink:'How Roku ECP works', securityStep:'ONE QUICK SECURITY STEP', allowNetwork:'Allow local network access', permissionDialog:'Your Roku is on your Wi‑Fi. Your browser needs permission before this page can send it commands.', permissionContinue:'Got it, continue', notNow:'Not now',
      invalidIp:'Enter a valid private IP address (for example, 192.168.1.25).', invalidPrefix:'Enter the first three blocks of a private IP (for example, 192.168.1).',
      blocked:'Your browser has blocked local network access.', scanBlocked:'Allow local network access to search for devices.', scanning:'Searching for devices responding on the Roku ECP port…', scanProgress:'Checked {done} of 254 addresses…', noCandidates:'No responses found. Check the range, network, and permission, or enter the IP manually.',
      candidates:'Possible devices ({count}). Tap one to select it, then press Connect.', lookingNames:'Checking available device names…', candidate:'Use {ip}', unnamed:'Possible Roku', scanError:'The search could not access your local network. Check browser permission or enter the IP manually.',
      sendingHome:'Requesting permission and sending Home…', sentHome:'Request sent to {ip}. Check the TV: if the Home screen appears, it is connected.', remoteReady:'Ready to send buttons. Browser privacy prevents reading Roku’s response, so confirm by looking at the TV.',
      sendError:'Could not send the command. Check local access, the IP address, and Roku network control settings.', keySent:'{key} button sent. The result depends on your Roku model.', keyError:'Could not send. Check that the device is still on the network.', launchingApp:'Requesting {app}…', appRequested:'Launch request sent for {app}. Roku needs that app to be available.',
      scanPermission:'To search your network, the browser needs local network access.', rokuName:'Roku',
    }
  };

  const preferredLanguage = (navigator.languages?.[0] || navigator.language || 'es').toLowerCase();
  const detected = preferredLanguage.startsWith('en') ? 'en' : 'es';
  let language = localStorage.getItem('rokuRemoteLanguage') || detected;
  const t = (key, values = {}) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), words[language][key] || key);

  function setLanguage(next, persist = true) {
    language = next;
    if (persist) localStorage.setItem('rokuRemoteLanguage', language);
    document.documentElement.lang = language;
    document.title = 'Roku Nexus';
    $('meta[name="description"]').content = t('metaDescription');
    document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(node => { node.setAttribute('aria-label', t(node.dataset.i18nAria)); });
    $('#roku-ip').placeholder = t('ipPlaceholder');
    $('#network-prefix').placeholder = t('prefixPlaceholder');
    textInput.placeholder = t('typePlaceholder');
    $('#lang-es').setAttribute('aria-pressed', String(language === 'es'));
    $('#lang-en').setAttribute('aria-pressed', String(language === 'en'));
    if (connectedIp) $('#remote-title').textContent = `${connectedName || t('rokuName')} · ${connectedIp}`;
    else $('#remote-title').textContent = 'Roku Nexus';
    if (!connectedIp) say(remoteStatus, t('noDevice'));
  }

  const say = (el, message, error = false) => {
    el.textContent = message;
    el.classList.toggle('error', error);
  };

  function setSettingsOpen(open) {
    settingsPanel.hidden = !open;
    settingsToggle.setAttribute('aria-expanded', String(open));
  }

  function updateRemoteAvailability() {
    const disabled = !connectedIp;
    document.querySelectorAll('#remote [data-key], #remote [data-app], #type-open').forEach(button => { button.disabled = disabled; });
    if (disabled) say(remoteStatus, t('noDevice'));
  }

  function validPrivateIp(value) {
    const parts = value.trim().split('.');
    if (parts.length !== 4 || parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return false;
    const [a,b] = parts.map(Number);
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }

  function validPrefix(value) {
    const parts = value.trim().split('.');
    if (parts.length !== 3 || parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return false;
    const [a,b] = parts.map(Number);
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }

  async function localPermission() {
    if (!navigator.permissions?.query) return 'unknown';
    try {
      const result = await navigator.permissions.query({ name: 'local-network' });
      result.addEventListener?.('change', () => {
        permissionState = result.state;
        if (result.state === 'granted') recovery.hidden = true;
      });
      return result.state;
    } catch {
      return 'unknown';
    }
  }

  function targetSpaceOptions() {
    return { targetAddressSpace: 'local' };
  }

  async function sendKey(ip, key) {
    const url = `http://${ip}:8060/keypress/${encodeURIComponent(key)}`;
    // ECP responses are cross-origin and Roku does not promise CORS headers.
    // The opaque response lets this page send a simple POST without reading it.
    return fetch(url, { method: 'POST', mode: 'no-cors', ...targetSpaceOptions() });
  }

  async function readDeviceName(ip) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    try {
      // This readable CORS request can reveal the Roku-reported friendly/model
      // name only on device/browser combinations that allow the page's origin.
      const response = await fetch(`http://${ip}:8060/query/device-info`, {
        method: 'GET', mode: 'cors', cache: 'no-store', signal: controller.signal, ...targetSpaceOptions()
      });
      if (!response.ok) return '';
      const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
      if (xml.querySelector('parsererror') || xml.documentElement.localName !== 'device-info') return '';
      const value = tag => xml.getElementsByTagName(tag)[0]?.textContent?.trim() || '';
      if (value('vendor-name').toLowerCase() !== 'roku') return '';
      return value('user-device-name') || value('friendly-device-name') || value('model-name') || '';
    } catch {
      // Roku does not guarantee CORS permission, so the IP remains a fallback.
      return '';
    } finally {
      clearTimeout(timeout);
    }
  }

  function appKeyFromName(name) {
    const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (normalized.includes('netflix')) return 'netflix';
    if (normalized.includes('youtube') && !normalized.includes('tv')) return 'youtube';
    if (normalized.includes('disney')) return 'disney';
    if (normalized.includes('spotify')) return 'spotify';
    if (normalized.includes('prime video') || normalized.includes('amazon video')) return 'prime';
    if (normalized.includes('hbo max') || normalized === 'max') return 'hbo';
    return '';
  }

  async function loadRokuAppIds(ip) {
    if (appIdsByDevice.has(ip)) return appIdsByDevice.get(ip);
    const appIds = new Map();
    try {
      const response = await fetch(`http://${ip}:8060/query/apps`, {
        method: 'GET', mode: 'cors', cache: 'no-store', ...targetSpaceOptions()
      });
      if (response.ok) {
        const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
        if (!xml.querySelector('parsererror')) {
          for (const app of Array.from(xml.getElementsByTagName('app'))) {
            const key = appKeyFromName(app.textContent || '');
            const id = app.getAttribute('id');
            if (key && id && /^\d+$/.test(id)) appIds.set(key, id);
          }
        }
      }
    } catch {
      // Roku does not guarantee CORS on query/apps; use the known ID fallback when needed.
    }
    appIdsByDevice.set(ip, appIds);
    return appIds;
  }

  function sendDiscoveryProbe(ip, signal) {
    return fetch(`http://${ip}:8060/query/device-info`, {
      method: 'GET', mode: 'no-cors', cache: 'no-store', signal, ...targetSpaceOptions()
    });
  }

  async function requestAction(action) {
    pendingAction = action;
    recovery.hidden = true;
    if (action === 'connect' && !validPrivateIp(ipInput.value)) {
      say(statusBox, t('invalidIp'), true);
      ipInput.focus();
      return;
    }
    if (action === 'scan' && !validPrefix(prefixInput.value)) {
      say(scanStatus, t('invalidPrefix'), true);
      prefixInput.focus();
      return;
    }
    permissionState = await localPermission();
    if (permissionState === 'denied') {
      setSettingsOpen(true);
      recovery.hidden = false;
      say(action === 'scan' ? scanStatus : statusBox, t('blocked'), true);
      return;
    }
    if (permissionState !== 'granted' && permissionDialog.showModal) {
      permissionDialog.showModal();
      return;
    }
    if (action === 'scan') await scanNetwork();
    else await trySendHome(ipInput.value.trim());
  }

  async function trySendHome(ip) {
    say(statusBox, t('sendingHome'));
    connectButton.disabled = true;
    try {
      await sendKey(ip, 'Home');
      connectedIp = ip;
      localStorage.setItem('rokuRemoteLastIp', ip);
      connectedName = discoveredNames.get(ip) || await readDeviceName(ip);
      if (connectedName) discoveredNames.set(ip, connectedName);
      loadRokuAppIds(ip);
      $('#remote-title').textContent = `${connectedName || t('rokuName')} · ${ip}`;
      updateRemoteAvailability();
      setSettingsOpen(false);
      say(statusBox, t('sentHome', { ip }));
      say(remoteStatus, t('remoteReady'));
    } catch {
      say(statusBox, t('sendError'), true);
      permissionState = await localPermission();
      recovery.hidden = permissionState !== 'denied' && permissionState !== 'unknown';
    } finally {
      connectButton.disabled = false;
    }
  }

  async function scanNetwork() {
    const prefix = prefixInput.value.trim();
    const candidates = [];
    let nextHost = 1;
    let completed = 0;
    scanButton.disabled = true;
    scanProgress.hidden = false;
    scanProgress.value = 0;
    scanResults.replaceChildren();
    say(scanStatus, t('scanning'));

    async function worker() {
      while (nextHost <= 254) {
        const host = nextHost++;
        const ip = `${prefix}.${host}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        try {
          await sendDiscoveryProbe(ip, controller.signal);
          candidates.push(ip);
        } catch {
          // Unreachable hosts, denied local-network requests, and timeouts are skipped.
        } finally {
          clearTimeout(timeout);
          completed++;
          scanProgress.value = completed;
          if (completed % 20 === 0 || completed === 254) say(scanStatus, t('scanProgress', { done: completed }));
        }
      }
    }

    await Promise.all(Array.from({ length: 12 }, () => worker()));
    scanProgress.hidden = true;
    scanButton.disabled = false;
    if (candidates.length === 0) {
      say(scanStatus, t('noCandidates'));
      return;
    }
    say(scanStatus, `${t('candidates', { count: candidates.length })} ${t('lookingNames')}`);
    candidates.sort((left, right) => Number(left.split('.').pop()) - Number(right.split('.').pop()));
    const devices = new Array(candidates.length);
    let nameIndex = 0;
    async function nameWorker() {
      while (nameIndex < candidates.length) {
        const index = nameIndex++;
        const ip = candidates[index];
        const name = await readDeviceName(ip);
        if (name) discoveredNames.set(ip, name);
        devices[index] = { ip, name };
      }
    }
    await Promise.all(Array.from({ length: Math.min(8, candidates.length) }, () => nameWorker()));
    devices.forEach(({ ip, name }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'scan-candidate';
      button.textContent = `${name || t('unnamed')} · ${ip}`;
      button.addEventListener('click', () => {
        ipInput.value = ip;
        $('#scan-panel').open = false;
        ipInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ipInput.focus({ preventScroll: true });
      });
      scanResults.append(button);
    });
  }

  async function onKey(key) {
    if (!connectedIp || !keys.has(key)) return;
    try {
      await sendKey(connectedIp, key);
      say(remoteStatus, t('keySent', { key }));
    } catch {
      say(remoteStatus, t('keyError'), true);
      setSettingsOpen(true);
      recovery.hidden = false;
    }
  }

  async function requestRemoteKey(key) {
    if (!connectedIp) {
      setSettingsOpen(true);
      say(remoteStatus, t('noDevice'));
      return;
    }
    pendingAction = 'key';
    pendingKey = key;
    permissionState = await localPermission();
    if (permissionState === 'denied') {
      setSettingsOpen(true);
      recovery.hidden = false;
      say(statusBox, t('blocked'), true);
      return;
    }
    if (permissionState !== 'granted' && permissionDialog.showModal) {
      permissionDialog.showModal();
      return;
    }
    await onKey(key);
  }

  const appTranslationKeys = { netflix:'appNetflix', youtube:'appYouTube', disney:'appDisney', spotify:'appSpotify', prime:'appPrime', hbo:'appHbo' };
  const appFallbackNames = { netflix:'Netflix', youtube:'YouTube', disney:'Disney+', spotify:'Spotify', prime:'Amazon Prime Video', hbo:'HBO Max' };

  async function launchRokuApp(appKey) {
    if (!connectedIp || !fallbackAppIds[appKey]) return;
    const appName = t(appTranslationKeys[appKey]);
    say(remoteStatus, t('launchingApp', { app: appName }));
    try {
      const appIds = await loadRokuAppIds(connectedIp);
      const appId = appIds.get(appKey) || fallbackAppIds[appKey];
      await fetch(`http://${connectedIp}:8060/launch/${encodeURIComponent(appId)}`, {
        method: 'POST', mode: 'no-cors', ...targetSpaceOptions()
      });
      say(remoteStatus, t('appRequested', { app: appName }));
    } catch {
      say(remoteStatus, t('keyError'), true);
    }
  }

  async function requestAppLaunch(appKey) {
    if (!connectedIp) {
      setSettingsOpen(true);
      say(remoteStatus, t('noDevice'));
      return;
    }
    pendingAction = 'app';
    pendingApp = appKey;
    permissionState = await localPermission();
    if (permissionState === 'denied') {
      setSettingsOpen(true);
      recovery.hidden = false;
      say(statusBox, t('blocked'), true);
      return;
    }
    if (permissionState !== 'granted' && permissionDialog.showModal) {
      permissionDialog.showModal();
      return;
    }
    await launchRokuApp(appKey);
  }

  let syncedText = '';
  let textSyncQueue = Promise.resolve();
  function syncTextToRoku() {
    const desiredAtEvent = Array.from(textInput.value);
    if (!connectedIp) return;
    say(keyboardStatus, language === 'en' ? 'Sending…' : 'Enviando…');
    textSyncQueue = textSyncQueue.then(async () => {
      const desired = desiredAtEvent;
      let common = 0;
      while (common < syncedText.length && common < desired.length && syncedText[common] === desired[common]) common++;
      const simpleAppend = common === syncedText.length;
      const simpleTailDelete = common === desired.length;
      if (simpleAppend) {
        for (const character of desired.slice(common)) await sendKey(connectedIp, `Lit_${character}`);
      } else if (simpleTailDelete) {
        for (let i = common; i < syncedText.length; i++) await sendKey(connectedIp, 'Backspace');
      } else {
        // For paste or edits away from the end, rebuild the typed text from the end position.
        for (let i = 0; i < syncedText.length; i++) await sendKey(connectedIp, 'Backspace');
        for (const character of desired) await sendKey(connectedIp, `Lit_${character}`);
      }
      syncedText = desired;
      say(keyboardStatus, language === 'en' ? 'Roku text updated.' : 'Texto actualizado en Roku.');
    }).catch(() => say(keyboardStatus, t('keyError'), true));
  }

  function deleteFromKeyboard() {
    const start = textInput.selectionStart ?? textInput.value.length;
    const end = textInput.selectionEnd ?? start;
    if (start === 0 && end === 0) return;
    const from = start === end ? Math.max(0, start - 1) : start;
    textInput.setRangeText('', from, end, 'end');
    textInput.dispatchEvent(new Event('input', { bubbles: true }));
    textInput.focus();
  }

  async function sendEnterFromKeyboard() {
    const button = $('#keyboard-enter');
    if (!connectedIp) return;
    button.disabled = true;
    try {
      await textSyncQueue;
      await sendKey(connectedIp, 'Enter');
      say(keyboardStatus, t('enterSent'));
    } catch {
      say(keyboardStatus, t('keyError'), true);
    } finally {
      button.disabled = false;
    }
  }

  $('#lang-es').addEventListener('click', () => setLanguage('es'));
  $('#lang-en').addEventListener('click', () => setLanguage('en'));
  connectButton.addEventListener('click', () => requestAction('connect'));
  scanButton.addEventListener('click', () => requestAction('scan'));
  ipInput.addEventListener('keydown', event => { if (event.key === 'Enter') requestAction('connect'); });
  ipInput.addEventListener('input', () => {
    if (validPrivateIp(ipInput.value)) prefixInput.value = ipInput.value.trim().split('.').slice(0,3).join('.');
  });
  prefixInput.addEventListener('keydown', event => { if (event.key === 'Enter') requestAction('scan'); });
  $('#permission-continue').addEventListener('click', async () => {
    permissionDialog.close();
    if (pendingAction === 'scan') await scanNetwork();
    else if (pendingAction === 'key') await onKey(pendingKey);
    else if (pendingAction === 'app') await launchRokuApp(pendingApp);
    else await trySendHome(ipInput.value.trim());
  });
  $('#permission-cancel').addEventListener('click', () => permissionDialog.close());
  $('#retry-button').addEventListener('click', async () => {
    recovery.hidden = true;
    permissionState = await localPermission();
    if (permissionState === 'denied') {
      recovery.hidden = false;
      say(pendingAction === 'scan' ? scanStatus : statusBox, t('blocked'), true);
    } else if (pendingAction === 'scan') await scanNetwork();
    else if (pendingAction === 'key') await onKey(pendingKey);
    else if (pendingAction === 'app') await launchRokuApp(pendingApp);
    else await trySendHome(ipInput.value.trim());
  });
  $('#settings-toggle').addEventListener('click', () => {
    if (settingsPanel.hidden) {
      setSettingsOpen(true);
    } else setSettingsOpen(false);
  });
  const settingsUrl = `chrome://settings/content/siteDetails?site=${encodeURIComponent(location.origin)}`;
  $('#settings-url').textContent = settingsUrl;
  $('#copy-settings').addEventListener('click', async event => {
    try {
      await navigator.clipboard.writeText(settingsUrl);
      event.currentTarget.textContent = t('copied');
    } catch {
      event.currentTarget.textContent = t('copyFallback');
    }
  });
  document.querySelectorAll('[data-key]').forEach(button => button.addEventListener('click', () => requestRemoteKey(button.dataset.key)));
  document.querySelectorAll('[data-app]').forEach(button => button.addEventListener('click', () => requestAppLaunch(button.dataset.app)));
  $('#type-open').addEventListener('click', () => {
    keyboardDialog.showModal();
    textInput.focus();
  });
  $('#keyboard-close').addEventListener('click', () => keyboardDialog.close());
  $('#keyboard-backspace').addEventListener('click', deleteFromKeyboard);
  $('#keyboard-enter').addEventListener('click', sendEnterFromKeyboard);
  textInput.addEventListener('input', syncTextToRoku);
  textInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') event.preventDefault();
  });

  const saved = localStorage.getItem('rokuRemoteLastIp');
  if (saved && validPrivateIp(saved)) {
    ipInput.value = saved;
    prefixInput.value = saved.split('.').slice(0,3).join('.');
    connectedIp = saved;
    $('#remote-title').textContent = `${t('rokuName')} · ${saved}`;
    say(remoteStatus, t('savedIpReady', { ip: saved }));
  }
  updateRemoteAvailability();
  setLanguage(language === 'en' ? 'en' : 'es', false);
})();
