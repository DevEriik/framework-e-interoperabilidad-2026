import React, { useState, useEffect, useRef, useCallback } from 'react';
import DailyIframe from '@daily-co/daily-js';

export default function VideoCallRoom({
  chatStatus = 'active',
  roomUrl,
  token,
  userName = 'Usuario ExpertoYa',
  userRole = 'cliente',
  titleId,
  onCloseCall,
}) {
  const [callState, setCallState] = useState('joining');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [networkQuality, setNetworkQuality] = useState('good');

  const [cameraFacing, setCameraFacing] = useState('user');
  const [availableCameras, setAvailableCameras] = useState([]);

  const callObjectRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const disconnectTimerRef = useRef(null);
  const isHangingUpRef = useRef(false);

  const isChatActive = chatStatus === 'active';

  const checkAvailableCameras = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === 'videoinput');
      setAvailableCameras(videoInputs);
    } catch (err) {
      console.warn('[ExpertoYa WebRTC] No se pudieron enumerar dispositivos de video:', err);
    }
  }, []);

  const cleanupCall = useCallback(async () => {
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }

    if (localVideoRef.current && localVideoRef.current.srcObject) {
      try {
        const stream = localVideoRef.current.srcObject;
        if (stream instanceof MediaStream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (e) {
        console.warn('[ExpertoYa WebRTC] Error al detener tracks locales:', e);
      }
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    const callInstance = callObjectRef.current || DailyIframe.getCallInstance();
    if (callInstance) {
      try {
        if (typeof callInstance.leave === 'function') {
          await callInstance.leave();
        }
        if (typeof callInstance.destroy === 'function') {
          await callInstance.destroy();
        }
      } catch (e) { }
      callObjectRef.current = null;
    }

    setCallState('disconnected');
  }, []);

  const startCamera = useCallback(async (facing = cameraFacing) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: true,
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setCallState('connected');
    } catch (err) {
      console.warn('[ExpertoYa WebRTC] Fallback a solo video:', err);
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = videoStream;
        }
        setCallState('connected');
      } catch (e) {
        console.warn('[ExpertoYa WebRTC] No se pudo obtener stream de cámara:', e);
        setErrorMessage('Por favor permite el acceso a tu cámara para el diagnóstico visual.');
        setCallState('connected');
      }
    }
  }, [cameraFacing]);

  useEffect(() => {
    if (!isChatActive) return;
    startCamera();

    const isMockUrl = !roomUrl || roomUrl.includes('expertoya.daily.co');

    if (!isMockUrl) {
      let call = DailyIframe.getCallInstance();
      if (!call) {
        try {
          call = DailyIframe.createCallObject({
            dailyConfig: {
              experimentalChromeVideoMuteLightOff: true,
              useDevicePreferenceStorage: false,
            },
          });
        } catch (createErr) {
          console.warn('[ExpertoYa WebRTC] DailyIframe ya instanciado:', createErr);
          call = DailyIframe.getCallInstance();
        }
      }

      callObjectRef.current = call;

      if (call) {
        call
          .on('joined-meeting', () => {
            setCallState('connected');
          })
          .on('participant-joined', (evt) => {
            const remote = evt.participant;
            if (remote && remoteVideoRef.current) {
              const tracks = [];
              if (remote.tracks?.video?.persistentTrack) tracks.push(remote.tracks.video.persistentTrack);
              if (remote.tracks?.audio?.persistentTrack) tracks.push(remote.tracks.audio.persistentTrack);
              if (tracks.length > 0) remoteVideoRef.current.srcObject = new MediaStream(tracks);
            }
          })
          .on('network-connection', (evt) => {
            if (evt?.event === 'interrupted') {
              setNetworkQuality('low');
            } else {
              setNetworkQuality('good');
            }
          })
          .on('left-meeting', () => {
            if (isHangingUpRef.current) {
              cleanupCall();
              if (onCloseCall) onCloseCall();
            }
          });

        const joinOptions = { url: roomUrl, userName: userName || 'Usuario ExpertoYa' };
        if (token && typeof token === 'string' && token.trim().length > 0) {
          joinOptions.token = token.trim();
        }

        call.join(joinOptions).catch((err) => {
          console.warn('[ExpertoYa WebRTC] Conexión remota no disponible, usando cámara local:', err);
        });
      }
    }

    const handleOffline = () => {
      setErrorMessage('Sin conexión a Internet.');
      setNetworkQuality('low');
    };
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      cleanupCall();
    };
  }, [isChatActive, roomUrl, token, userName, cleanupCall, checkAvailableCameras, onCloseCall, startCamera]);

  const toggleAudio = useCallback(() => {
    const next = !isAudioMuted;
    if (callObjectRef.current && typeof callObjectRef.current.setLocalAudio === 'function') {
      try {
        callObjectRef.current.setLocalAudio(!next);
      } catch (_) { }
    }
    if (localVideoRef.current?.srcObject instanceof MediaStream) {
      localVideoRef.current.srcObject.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
    }
    setIsAudioMuted(next);
  }, [isAudioMuted]);

  const toggleVideo = useCallback(() => {
    const next = !isVideoMuted;
    if (callObjectRef.current && typeof callObjectRef.current.setLocalVideo === 'function') {
      try {
        callObjectRef.current.setLocalVideo(!next);
      } catch (_) { }
    }
    if (localVideoRef.current?.srcObject instanceof MediaStream) {
      localVideoRef.current.srcObject.getVideoTracks().forEach((track) => {
        track.enabled = !next;
      });
    }
    setIsVideoMuted(next);
  }, [isVideoMuted]);

  const toggleCameraFacing = useCallback(async () => {
    const targetFacing = cameraFacing === 'user' ? 'environment' : 'user';

    if (callObjectRef.current && typeof callObjectRef.current.setInputDevicesAsync === 'function') {
      try {
        await callObjectRef.current.setInputDevicesAsync({
          audioDeviceId: null,
          videoDeviceId: null,
          videoSource: { facingMode: { exact: targetFacing } },
        });
      } catch (_) { }
    }

    if (localVideoRef.current?.srcObject instanceof MediaStream) {
      localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }

    await startCamera(targetFacing);
    setCameraFacing(targetFacing);
  }, [cameraFacing, startCamera]);

  const handleHangUp = useCallback(() => {
    isHangingUpRef.current = true;
    cleanupCall();
    if (onCloseCall) {
      onCloseCall();
    }
  }, [cleanupCall, onCloseCall]);

  if (!isChatActive) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#FDFCF4] dark:bg-[#121826] border-2 border-dashed border-[#FF8C00] dark:border-[#FFB74D] rounded-2xl text-center max-w-lg mx-auto shadow-md font-sans">
        <div className="p-3 bg-[#FF8C00]/10 dark:bg-[#FFB74D]/20 rounded-full mb-3">
          <svg className="w-8 h-8 text-[#FF8C00] dark:text-[#FFB74D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[#283593] dark:text-gray-100 mb-1">
          Diagnóstico Visual No Disponible
        </h3>
        <p className="text-sm text-[#283593]/80 dark:text-gray-300">
          La sala de videollamada solo puede iniciarse cuando el chat con el profesional está en estado{' '}
          <span className="font-semibold text-[#00BFA5] dark:text-[#33EFA5]">ACTIVO</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto overflow-hidden rounded-2xl shadow-2xl bg-[#FDFCF4] dark:bg-[#121826] border border-[#00BFA5]/30 dark:border-[#33EFA5]/20 font-sans transition-colors duration-300">

      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-[#FDFCF4] dark:bg-[#121826]">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-[#00BFA5] dark:bg-[#33EFA5] animate-pulse" aria-hidden="true" />
          <div>
            <h2 id={titleId} className="text-lg font-bold text-[#283593] dark:text-gray-100">
              ExpertoYa — Diagnóstico Preliminar
            </h2>
            <p className="text-xs text-[#283593]/70 dark:text-gray-400">
              Canal WebRTC seguro P2P / SFU
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white dark:bg-[#1F2937] px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
            <span className="text-xs font-semibold text-[#283593] dark:text-gray-300">Señal:</span>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${networkQuality === 'good'
                  ? 'text-[#00BFA5] dark:text-[#33EFA5]'
                  : 'text-[#FF8C00] dark:text-[#FFB74D]'
                }`}
            >
              {networkQuality === 'good' ? 'Óptima' : 'Inestable'}
            </span>
          </div>

          <button
            onClick={handleHangUp}
            type="button"
            aria-label="Cerrar ventana de videollamada"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <main className="relative flex-1 min-h-[420px] bg-black/95 flex items-center justify-center overflow-hidden">
        {errorMessage && (
          <div className="absolute top-4 left-4 right-4 z-30 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 flex items-center justify-between shadow-lg text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-[#FF8C00] dark:text-[#FFB74D] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-xs font-bold underline ml-4 hover:opacity-80">
              Ocultar
            </button>
          </div>
        )}

        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          aria-label="Transmisión de video remota"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121826]/75 backdrop-blur-xs text-center p-6 z-10 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-[#00BFA5]/20 dark:bg-[#33EFA5]/20 border-2 border-[#00BFA5] dark:border-[#33EFA5] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#00BFA5] dark:text-[#33EFA5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-white text-base font-semibold">
            {userRole === 'cliente' ? 'Especialista: Martín Benítez' : 'Cliente: Abril'}
          </p>
          <p className="text-gray-300 text-xs mt-1 max-w-sm">
            Diagnóstico preliminar visual en vivo. Usa tu cámara para mostrar el desperfecto.
          </p>
        </div>

        <div className="absolute bottom-4 right-4 w-36 sm:w-56 aspect-video rounded-xl overflow-hidden border-2 border-[#00BFA5] dark:border-[#33EFA5] shadow-2xl bg-gray-900 z-20">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
            aria-label="Tu cámara local"
          />
          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] text-white font-semibold">
            Tú ({userRole})
          </div>
          {isVideoMuted && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 text-gray-300 text-xs font-medium">
              Cámara Off
            </div>
          )}
        </div>
      </main>

      <footer className="p-4 sm:p-6 bg-[#FDFCF4] dark:bg-[#1F2937] border-t border-gray-200 dark:border-gray-800 transition-colors">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">

          <button
            onClick={toggleAudio}
            type="button"
            aria-label={isAudioMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
            aria-pressed={isAudioMuted}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-[#00BFA5] dark:focus:ring-[#33EFA5] focus:ring-offset-2 cursor-pointer ${isAudioMuted
                ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700'
                : 'bg-[#FF8C00] text-white hover:bg-[#e67e00] dark:bg-[#FFB74D] dark:text-[#121826] dark:hover:bg-[#ffa726]'
              }`}
          >
            {isAudioMuted ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
            <span>{isAudioMuted ? 'Silenciado' : 'Silenciar'}</span>
          </button>

          <button
            onClick={toggleVideo}
            type="button"
            aria-label={isVideoMuted ? 'Activar cámara de video' : 'Desactivar cámara de video'}
            aria-pressed={isVideoMuted}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-[#00BFA5] dark:focus:ring-[#33EFA5] focus:ring-offset-2 cursor-pointer ${isVideoMuted
                ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700'
                : 'bg-[#FF8C00] text-white hover:bg-[#e67e00] dark:bg-[#FFB74D] dark:text-[#121826] dark:hover:bg-[#ffa726]'
              }`}
          >
            {isVideoMuted ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            <span>{isVideoMuted ? 'Cámara Off' : 'Cámara On'}</span>
          </button>

          <button
            onClick={toggleCameraFacing}
            type="button"
            aria-label={`Cambiar a cámara ${cameraFacing === 'user' ? 'trasera' : 'frontal'}`}
            title="Alternar cámara para enfocar el trabajo o avería"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md bg-white text-[#283593] border-2 border-[#00BFA5] hover:bg-[#00BFA5]/10 dark:bg-[#121826] dark:text-[#33EFA5] dark:border-[#33EFA5] dark:hover:bg-[#33EFA5]/10 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] dark:focus:ring-[#33EFA5] focus:ring-offset-2 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">
              {cameraFacing === 'user' ? 'Cámara Trasera' : 'Cámara Frontal'}
            </span>
          </button>

          <button
            onClick={handleHangUp}
            type="button"
            aria-label="Cortar videollamada y salir de la sala"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 bg-[#EF4444] hover:bg-red-600 text-white dark:bg-[#F87171] dark:hover:bg-red-500 dark:text-gray-950 cursor-pointer"
          >
            <svg className="w-5 h-5 transform rotate-135" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Cortar</span>
          </button>

        </div>
      </footer>
    </div>
  );
}

export function CallLauncherButton({ chatStatus, onStartCall }) {
  if (chatStatus !== 'active') return null;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onStartCall) onStartCall();
      }}
      type="button"
      aria-label="Diagnóstico en Vivo: iniciar videollamada de diagnóstico preliminar"
      className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm bg-[#FF8C00] text-white hover:bg-[#e67e00] dark:bg-[#FFB74D] dark:text-[#121826] dark:hover:bg-[#ffa726] focus:outline-none focus:ring-2 focus:ring-[#00BFA5] dark:focus:ring-[#33EFA5] focus:ring-offset-2 font-sans cursor-pointer select-none"
    >
      <svg className="w-4 h-4 text-white dark:text-[#121826]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <span>Diagnóstico en Vivo</span>
    </button>
  );
}
