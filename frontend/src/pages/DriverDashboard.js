import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import RideStatus from '../components/RideStatus';
import { rideService } from '../services/rideService';

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

// Função de utilidade que pode ficar fora
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const defaultCenter = {
  lat: -23.550520, // São Paulo
  lng: -46.633308
};

// Remover constantes não utilizadas
const GEO_CONFIG = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 30000,
  retryAttempts: 2,
  retryDelay: 3000
};

// Ajustar configurações de polling
const POLLING_CONFIG = {
  interval: 30000,        // 30 segundos entre polls
  retryDelay: 5000,      // 5 segundos para retry
  notificationDuration: 15000,
  minPollingInterval: 15000, // Mínimo 15 segundos entre requisições
  maxRetries: 3          // Máximo de tentativas em caso de erro
};

// Função para gerar ID único
const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Ajustar configurações de áudio
const AUDIO_CONFIG = {
  volume: 0.8,           // Volume alto
  maxRetries: 3,         // Tentativas para cada reprodução
  retryDelay: 500,       // Delay entre tentativas
  notificationSound: '/sounds/notification.mp3',
  preloadAttempts: 2,    // Tentativas de pré-carregamento
  repeatInterval: 3000,  // Tocar a cada 3 segundos
  maxRepetitions: 10     // Máximo de repetições (30 segundos total)
};

export default function DriverDashboard() {
  // Estados
  const [currentRide, setCurrentRide] = useState(null);
  const [availableRides, setAvailableRides] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationStatus, setLocationStatus] = useState('pending');
  const [audioEnabled, setAudioEnabled] = useState(() => {
    return localStorage.getItem('audioEnabled') === 'true';
  });

  // Ref para controlar throttling
  const lastFetchRef = useRef(Date.now());
  const retryCountRef = useRef(0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Refs necessárias
  const mapRef = useRef(null);
  const lastLocationRef = useRef(null);
  const geoErrorTimeoutRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Adicionar ref para controlar repetição
  const audioInstanceRef = useRef(null);
  const repeatIntervalRef = useRef(null);
  const repeatCountRef = useRef(0);

  // Função para carregar o mapa
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Função para limpar rota do mapa
  const clearMapRoute = useCallback(() => {
    if (mapRef.current) {
      mapRef.current = null;
    }
  }, []);

  // Pré-carregar áudio
  useEffect(() => {
    const preloadAudio = async (attempts = AUDIO_CONFIG.preloadAttempts) => {
      try {
        const audio = new Audio(AUDIO_CONFIG.notificationSound);
        audio.volume = AUDIO_CONFIG.volume;
        audio.preload = 'auto';
        
        // Forçar carregamento
        await audio.load();
        
        audioInstanceRef.current = audio;
      } catch (error) {
        console.error('Erro ao pré-carregar áudio:', error);
        if (attempts > 0) {
          setTimeout(() => preloadAudio(attempts - 1), 1000);
        }
      }
    };

    preloadAudio();

    // Cleanup
    return () => {
      if (audioInstanceRef.current) {
        audioInstanceRef.current.pause();
        audioInstanceRef.current = null;
      }
    };
  }, []);

  // Função para parar o som
  const stopNotificationSound = useCallback(() => {
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
    repeatCountRef.current = 0;
    
    if (audioInstanceRef.current) {
      audioInstanceRef.current.pause();
      audioInstanceRef.current.currentTime = 0;
    }
  }, []);

  // Função otimizada para tocar som repetidamente
  const playNotificationSound = useCallback(() => {
    if (!audioEnabled) return;

    // Parar reprodução anterior se existir
    stopNotificationSound();

    const playWithRetry = async (retries = AUDIO_CONFIG.maxRetries) => {
      try {
        if (!audioInstanceRef.current) {
          audioInstanceRef.current = new Audio(AUDIO_CONFIG.notificationSound);
          audioInstanceRef.current.volume = AUDIO_CONFIG.volume;
          await audioInstanceRef.current.load();
        }

        const audio = audioInstanceRef.current;
        audio.currentTime = 0;
        await audio.play();

      } catch (error) {
        console.error('Erro ao tocar som:', error);
        audioInstanceRef.current = null;
        
        if (retries > 0) {
          setTimeout(() => playWithRetry(retries - 1), AUDIO_CONFIG.retryDelay);
        }
      }
    };

    // Iniciar reprodução repetida
    playWithRetry();
    repeatIntervalRef.current = setInterval(() => {
      if (repeatCountRef.current >= AUDIO_CONFIG.maxRepetitions) {
        stopNotificationSound();
        return;
      }
      repeatCountRef.current++;
      playWithRetry();
    }, AUDIO_CONFIG.repeatInterval);

  }, [audioEnabled, stopNotificationSound]);

  // Função para alternar som
  const toggleAudio = useCallback(() => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    localStorage.setItem('audioEnabled', String(newState));
    
    setError(newState ? 'Som ativado!' : 'Som desativado');
    setTimeout(() => setError(''), 2000);

    if (newState) {
      playNotificationSound();
    }
  }, [audioEnabled, playNotificationSound]);

  // 1. Primeiro definir calculateRoute
  const calculateRoute = useCallback(async (destination) => {
    if (!currentLocation || !destination) return;

    try {
      const directionsService = new window.google.maps.DirectionsService();
      
      const result = await directionsService.route({
        origin: currentLocation,
        destination: {
          lat: destination[1],
          lng: destination[0]
        },
        travelMode: window.google.maps.TravelMode.DRIVING
      });

      setDirections(result);

      if (directionsRenderer) {
        directionsRenderer.setDirections(result);
      } else {
        const renderer = new window.google.maps.DirectionsRenderer();
        renderer.setMap(mapRef.current);
        renderer.setDirections(result);
        setDirectionsRenderer(renderer);
      }
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      setError('Não foi possível calcular a rota');
    }
  }, [currentLocation, directionsRenderer]);

  // Função para obter localização com retry
  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      const tryGetPosition = (retries = GEO_CONFIG.retryAttempts) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            lastLocationRef.current = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            resolve(position);
          },
          (error) => {
            if (retries > 1) {
              setTimeout(() => tryGetPosition(retries - 1), GEO_CONFIG.retryDelay);
            } else {
              if (lastLocationRef.current) {
                resolve({ coords: lastLocationRef.current });
              } else {
                reject(error);
              }
            }
          },
          GEO_CONFIG
        );
      };

      tryGetPosition();
    });
  }, []);

  // Atualizar requestLocationPermission
  const requestLocationPermission = useCallback(async () => {
    try {
      setLocationStatus('pending');
      
      if (!navigator.geolocation) {
        setLocationError('Seu dispositivo não suporta geolocalização');
        setLocationStatus('denied');
        return false;
      }

      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          setLocationError('Permissão de localização negada. Por favor, habilite no seu navegador.');
          setLocationStatus('denied');
          return false;
        }
      }

      try {
        const position = await getCurrentPosition();
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setCurrentLocation(newLocation);
        setLocationStatus('granted');
        setLocationError(null);
        return true;
      } catch (error) {
        console.error('Erro ao obter localização:', error);
        let errorMessage = 'Erro ao obter sua localização';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada';
            setLocationStatus('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localização indisponível';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tempo excedido ao obter localização. Tentando novamente...';
            // Tenta novamente após timeout
            try {
              const position = await getCurrentPosition();
              const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              setCurrentLocation(newLocation);
              setLocationStatus('granted');
              setLocationError(null);
              return true;
            } catch (retryError) {
              errorMessage = 'Não foi possível obter sua localização após várias tentativas';
            }
            break;
          default:
            errorMessage = 'Erro desconhecido ao obter localização';
        }
        
        setLocationError(errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      setLocationError('Erro inesperado ao obter localização');
      return false;
    }
  }, [getCurrentPosition]);

  // Atualizar useEffect de localização
  useEffect(() => {
    let watchId = null;
    let errorCount = 0;
    const MAX_ERRORS = 5;
    const ERROR_RESET_DELAY = 60000; // 1 minuto

    const startLocationWatch = async () => {
      try {
        const hasPermission = await requestLocationPermission();
        
        if (hasPermission) {
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              lastLocationRef.current = newLocation;
              setCurrentLocation(newLocation);
              setLocationError(null);
              errorCount = 0; // Reset contador de erros
              
              if (currentRide?.origin?.coordinates) {
                calculateRoute(currentRide.origin.coordinates);
              }
            },
            (error) => {
              errorCount++;
              
              // Só mostra erro após várias falhas
              if (errorCount >= MAX_ERRORS) {
                console.error('Múltiplos erros de localização:', error);
                setLocationError('Problemas ao atualizar sua localização');
                
                // Tenta reiniciar o watch após muitos erros
                if (watchId) {
                  navigator.geolocation.clearWatch(watchId);
                  // Usa última localização conhecida se disponível
                  if (lastLocationRef.current) {
                    setCurrentLocation(lastLocationRef.current);
                  }
                  // Agenda nova tentativa
                  geoErrorTimeoutRef.current = setTimeout(() => {
                    errorCount = 0;
                    startLocationWatch();
                  }, ERROR_RESET_DELAY);
                }
              }
            },
            GEO_CONFIG
          );
        }
      } catch (error) {
        console.error('Erro ao iniciar monitoramento:', error);
      }
    };

    if (isOnline) {
      startLocationWatch();
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (geoErrorTimeoutRef.current) {
        clearTimeout(geoErrorTimeoutRef.current);
      }
    };
  }, [isOnline, currentRide, calculateRoute, requestLocationPermission]);

  // Função otimizada para buscar corridas
  const fetchAvailableRides = useCallback(async () => {
    if (!isOnline || currentRide) return;

    // Controle de throttling
    const now = Date.now();
    if (now - lastFetchRef.current < POLLING_CONFIG.minPollingInterval) {
      return;
    }

    try {
      lastFetchRef.current = now;
      const rides = await rideService.getAvailableRides();
      
      const newRides = rides.filter(ride => 
        !availableRides.some(existing => existing._id === ride._id)
      );

      if (newRides.length > 0) {
        playNotificationSound();
      }
      
      setAvailableRides(rides);
      setLastUpdate(now);
      setError('');
      retryCountRef.current = 0; // Reset contador de tentativas
    } catch (error) {
      console.error('Erro ao buscar corridas:', error);
      
      // Lógica de retry
      if (retryCountRef.current < POLLING_CONFIG.maxRetries) {
        retryCountRef.current++;
        setTimeout(fetchAvailableRides, POLLING_CONFIG.retryDelay);
      } else if (!error.message.includes('timeout')) {
        setError('Erro ao buscar corridas disponíveis');
      }
    }
  }, [isOnline, currentRide, availableRides, playNotificationSound]);

  // Usar debounce para o polling
  const debouncedFetch = useCallback(
    debounce(fetchAvailableRides, 1000),
    [fetchAvailableRides]
  );

  // Atualizar useEffect do polling
  useEffect(() => {
    let intervalId;

    if (isOnline && !currentRide) {
      // Primeira busca
      debouncedFetch();
      
      // Configurar intervalo
      intervalId = setInterval(debouncedFetch, POLLING_CONFIG.interval);
      pollingIntervalRef.current = intervalId;
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        pollingIntervalRef.current = null;
      }
    };
  }, [isOnline, currentRide, debouncedFetch]);

  // 2. Depois definir fetchAvailableRide que usa playNotification
  const fetchAvailableRide = useCallback(async () => {
    if (!isOnline || currentRide) return;
    try {
      const response = await api.get('/rides/available');
      if (response.data.length > 0) {
        setAvailableRides(response.data);
        playNotificationSound();
      }
    } catch (error) {
      console.error('Erro ao buscar corridas:', error);
    }
  }, [isOnline, currentRide, playNotificationSound]);

  // 3. Depois definir debouncedFetch que usa fetchAvailableRide
  const debouncedFetchRide = useCallback(
    () => debounce(() => fetchAvailableRide(), 1000),
    [fetchAvailableRide]
  );

  // Função para processar dados da corrida
  const processRideData = useCallback((ride) => {
    if (!currentLocation) {
      console.error('Localização atual não disponível');
      return null;
    }

    // Converte a localização atual para LatLng
    const origin = new window.google.maps.LatLng(
      currentLocation.lat,
      currentLocation.lng
    );

    // Define o destino baseado no status da corrida
    const destinationCoords = ride.status === 'accepted' 
      ? ride.origin.coordinates  // Se aceita, vai até o passageiro
      : ride.destination.coordinates; // Se em progresso, vai até o destino final

    const destination = new window.google.maps.LatLng(
      destinationCoords[1],  // latitude
      destinationCoords[0]   // longitude
    );

    return {
      origin,
      destination,
      travelMode: window.google.maps.TravelMode.DRIVING
    };
  }, [currentLocation]);

  // Função para atualizar a rota no mapa
  const updateMapRoute = useCallback(async (routeData) => {
    if (!mapRef.current || !window.google) return;

    try {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }

      const directionsService = new window.google.maps.DirectionsService();
      const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: false,
        preserveViewport: false
      });

      const result = await directionsService.route(routeData);
      
      newDirectionsRenderer.setDirections(result);
      setDirectionsRenderer(newDirectionsRenderer);
      setDirections(result);

      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(routeData.origin);
      bounds.extend(routeData.destination);
      mapRef.current.fitBounds(bounds);

    } catch (error) {
      console.error('Erro ao atualizar rota:', error);
      setError('Erro ao atualizar rota no mapa');
    }
  }, [directionsRenderer]);

  // Defina renderMarker usando useCallback antes de usá-lo
  const renderMarker = useCallback((position) => {
    if (!position || !window.google || !mapRef.current) return null;

    // Usa o Marker padrão em vez do AdvancedMarkerElement
    return new window.google.maps.Marker({
      position,
      map: mapRef.current,
      title: "Sua localização",
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new window.google.maps.Size(32, 32)
      }
    });
  }, []);

  // Renderizar mensagem de erro de localização
  const renderLocationError = () => {
    if (!locationError) return null;

    return (
      <div className="fixed top-16 left-0 right-0 z-50 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Erro de localização: </strong>
          <span className="block sm:inline">{locationError}</span>
          {locationStatus === 'denied' && (
            <div className="mt-2">
              <button
                onClick={requestLocationPermission}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Adicione este useEffect no início do componente
  useEffect(() => {
    const setInitialAvailability = async () => {
      try {
        await api.patch('/users/availability', { isAvailable: true });
        setIsOnline(true);
        console.log('Motorista marcado como disponível');
      } catch (error) {
        console.error('Erro ao definir disponibilidade inicial:', error);
        setError('Erro ao definir disponibilidade');
      }
    };

    setInitialAvailability();
  }, []);

  // Atualizar a função handleAcceptRide
  const handleAcceptRide = async (rideId) => {
    try {
      setLoading(true);
      stopNotificationSound(); // Parar som ao aceitar corrida
      const updatedRide = await rideService.acceptRide(rideId);
      setCurrentRide(updatedRide);
      
      if (updatedRide.origin?.coordinates) {
        calculateRoute(updatedRide.origin.coordinates);
      }
    } catch (error) {
      console.error('Erro ao aceitar corrida:', error);
      setError('Não foi possível aceitar a corrida');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar a função handleStartRide
  const handleStartRide = async () => {
    try {
      const response = await api.post(`/rides/start/${currentRide._id}`);
      setCurrentRide(response.data);
    } catch (error) {
      console.error('Erro ao iniciar corrida:', error);
      setError('Erro ao iniciar corrida');
    }
  };

  // Atualizar a função handleCompleteRide
  const handleCompleteRide = useCallback(async () => {
    if (!currentRide) return;

    try {
      await api.post(`/rides/complete/${currentRide._id}`);
      setCurrentRide(null);
      setDirections(null);
      setAvailableRides([]);
      
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
        setDirectionsRenderer(null);
      }

      setError('Corrida finalizada com sucesso!');
      setTimeout(() => {
        setError('');
      }, 3000);

    } catch (error) {
      console.error('Erro ao finalizar corrida:', error);
      setError(error?.response?.data?.message || 'Erro ao finalizar corrida');
    }
  }, [currentRide, directionsRenderer]);

  // Usar as funções em algum lugar do código
  useEffect(() => {
    if (isOnline && !currentRide) {
      debouncedFetch();
    }
  }, [isOnline, currentRide, debouncedFetch]);

  useEffect(() => {
    return () => {
      clearMapRoute();
    };
  }, [clearMapRoute]);

  // Adicionar função updateRideStatus
  const updateRideStatus = useCallback(async (rideId, status) => {
    try {
      let updatedRide;
      switch (status) {
        case 'arrived':
          updatedRide = await rideService.driverArrived(rideId);
          break;
        case 'start':
          updatedRide = await rideService.startRide(rideId);
          break;
        case 'complete':
          updatedRide = await rideService.completeRide(rideId);
          break;
        default:
          return;
      }
      setCurrentRide(updatedRide);
    } catch (error) {
      setError(`Erro ao atualizar status para ${status}`);
      console.error(error);
    }
  }, []);

  // Remover o AudioPermissionPrompt e usar apenas o AudioToggleButton
  const AudioToggleButton = () => (
    <button
      onClick={toggleAudio}
      className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors duration-200 ${
        audioEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
      }`}
    >
      {audioEnabled ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
        </svg>
      )}
      <span className="text-sm">{audioEnabled ? 'Som On' : 'Som Off'}</span>
    </button>
  );

  // Cleanup
  useEffect(() => {
    return () => {
      stopNotificationSound();
    };
  }, [stopNotificationSound]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">Processando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de Status */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <AudioToggleButton />
          </div>
          
          <button
            onClick={async () => {
              try {
                const newStatus = !isOnline;
                await api.patch('/users/availability', { isAvailable: newStatus });
                setIsOnline(newStatus);
              } catch (error) {
                console.error('Erro ao alterar status:', error);
                setError('Erro ao alterar status');
              }
            }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
              isOnline 
                ? 'bg-red-500 text-white active:bg-red-600' 
                : 'bg-green-500 text-white active:bg-green-600'
            }`}
          >
            {isOnline ? 'Ficar Offline' : 'Ficar Online'}
          </button>
        </div>
      </div>

      {/* Erro de Localização */}
      {renderLocationError()}

      {/* Conteúdo Principal */}
      <div className="pt-16 pb-20"> {/* Espaço para a barra de status e bottom bar */}
        <div className="container mx-auto px-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Mapa */}
          <div className="mb-4 rounded-lg overflow-hidden shadow-lg h-[300px]">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={currentLocation || defaultCenter}
              zoom={15}
              onLoad={onMapLoad}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                fullscreenControl: true
              }}
            >
              {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>
          </div>

          {/* Corrida Atual ou Lista de Corridas */}
          <div className="bg-white rounded-lg shadow-lg">
            {currentRide ? (
              <div className="p-4 space-y-4">
                <RideStatus status={currentRide.status} ride={currentRide} />
                
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">Detalhes da Corrida</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>De:</strong> {currentRide.origin.address}</p>
                    <p><strong>Para:</strong> {currentRide.destination.address}</p>
                    <p><strong>Distância:</strong> {(currentRide.distance/1000).toFixed(1)}km</p>
                    <p><strong>Valor:</strong> R$ {currentRide.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  {currentRide.status === 'accepted' && (
                    <button
                      onClick={() => updateRideStatus(currentRide._id, 'arrived')}
                      className="w-full py-3 bg-blue-500 text-white rounded-lg active:bg-blue-600 transition-colors duration-200"
                    >
                      Cheguei ao Local
                    </button>
                  )}
                  
                  {currentRide.status === 'driver_arrived' && (
                    <button
                      onClick={() => updateRideStatus(currentRide._id, 'start')}
                      className="w-full py-3 bg-green-500 text-white rounded-lg active:bg-green-600 transition-colors duration-200"
                    >
                      Iniciar Corrida
                    </button>
                  )}
                  
                  {currentRide.status === 'in_progress' && (
                    <button
                      onClick={() => updateRideStatus(currentRide._id, 'complete')}
                      className="w-full py-3 bg-purple-500 text-white rounded-lg active:bg-purple-600 transition-colors duration-200"
                    >
                      Finalizar Corrida
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Corridas Disponíveis</h2>
                {availableRides.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="mt-2">Nenhuma corrida disponível no momento</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableRides.map(ride => (
                      <div key={ride._id} className="border rounded-lg p-4 active:bg-gray-50">
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-1">
                              <p className="font-medium">De: {ride.origin.address}</p>
                              <p className="font-medium">Para: {ride.destination.address}</p>
                              <div className="flex space-x-4 text-sm text-gray-500">
                                <span>{(ride.distance / 1000).toFixed(1)} km</span>
                                <span>{Math.round(ride.duration / 60)} min</span>
                              </div>
                              <p className="text-lg font-bold text-green-600">R$ {ride.price.toFixed(2)}</p>
                            </div>
                            <button
                              onClick={() => handleAcceptRide(ride._id)}
                              className="ml-4 px-4 py-2 bg-green-500 text-white rounded-lg active:bg-green-600 transition-colors duration-200 text-sm font-medium"
                            >
                              Aceitar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Status do Motorista (Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">Status: {isOnline ? 'Disponível' : 'Indisponível'}</p>
            <p className="text-xs text-gray-500">Última atualização: {new Date(lastUpdate).toLocaleTimeString()}</p>
          </div>
          {showChat && currentRide && (
            <button
              onClick={() => setShowChat(!showChat)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
            >
              Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 