import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';
import RideStatus from '../components/RideStatus';
import RideChat from '../components/RideChat';
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

  // Refs
  const mapRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const audioRef = useRef(null);

  // 1. Primeiro definir playNotification
  const playNotification = useCallback(() => {
    if (!audioRef.current || !isOnline) return;

    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.error('Erro ao tocar áudio:', error);
      });
    } catch (error) {
      console.error('Erro ao manipular áudio:', error);
    }
  }, [isOnline]);

  // 2. Depois definir fetchAvailableRide que usa playNotification
  const fetchAvailableRide = useCallback(async () => {
    if (!isOnline || currentRide) return;
    try {
      const response = await api.get('/rides/available');
      if (response.data.length > 0) {
        setAvailableRides(response.data);
        playNotification();
      }
    } catch (error) {
      console.error('Erro ao buscar corridas:', error);
    }
  }, [isOnline, currentRide, playNotification]);

  // 3. Depois definir debouncedFetch que usa fetchAvailableRide
  const debouncedFetch = useCallback(
    () => debounce(() => fetchAvailableRide(), 1000),
    [fetchAvailableRide]
  );

  // Inicializa o áudio
  useEffect(() => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.preload = 'auto';
    audio.volume = 1.0;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const clearMapRoute = useCallback(() => {
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
      setDirectionsRenderer(null);
    }
  }, [directionsRenderer]);

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

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    
    if (currentLocation) {
      renderMarker(currentLocation);
    }
  }, [currentLocation, renderMarker]);

  const updateLocation = useCallback(async (position) => {
    try {
      const coordinates = [position.coords.longitude, position.coords.latitude];
      await api.patch('/users/location', { coordinates });
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
    }
  }, []);

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

  // Modifique o useEffect de localização para incluir logs
  useEffect(() => {
    if (isOnline) {
      console.log('Iniciando monitoramento de localização');
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coordinates = [position.coords.longitude, position.coords.latitude];
          console.log('Nova localização:', coordinates);
          updateLocation(position);
        },
        (error) => {
          console.error('Erro de geolocalização:', error);
          setError('Erro ao obter localização');
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      return () => {
        console.log('Parando monitoramento de localização');
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [isOnline, updateLocation]);

  // 1. Primeiro definir stopPolling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('Parando polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setAvailableRides([]); // Limpa qualquer corrida disponível ao parar
    }
  }, []);

  // 2. Depois definir startPolling que usa stopPolling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    console.log('Iniciando polling de corridas...');
    pollingIntervalRef.current = setInterval(async () => {
      try {
        // Só faz polling se estiver online e sem corrida atual
        if (!isOnline || currentRide) {
          console.log('Parando polling:', { isOnline, hasCurrent: !!currentRide });
          stopPolling();
          return;
        }

        const response = await api.get('/rides/available');
        if (response.data.length > 0) {
          setAvailableRides(response.data);
          playNotification();
        } else {
          setAvailableRides([]);
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 5000);
  }, [isOnline, currentRide, playNotification, stopPolling]);

  // 3. Depois o useEffect que usa ambas as funções
  useEffect(() => {
    const loadCurrentRide = async () => {
      try {
        const response = await api.get('/rides/current');
        if (response.data) {
          const currentRide = response.data;
          setCurrentRide(currentRide);
          stopPolling(); // Para o polling se tiver corrida atual

          const rideData = processRideData(currentRide);
          if (rideData) {
            await updateMapRoute(rideData);
          }
        } else {
          // Se não tem corrida atual e está online, inicia o polling
          if (isOnline) {
            startPolling();
          }
        }
      } catch (error) {
        console.error('Erro ao carregar corrida atual:', error);
        setError('Erro ao carregar corrida atual');
      }
    };

    if (isOnline) {
      loadCurrentRide();
    } else {
      stopPolling(); // Para o polling se ficar offline
    }

    // Cleanup quando o componente desmontar
    return () => {
      stopPolling();
    };
  }, [isOnline, processRideData, updateMapRoute, startPolling, stopPolling]);

  // Adicionar detector de interação do usuário
  useEffect(() => {
    const handleInteraction = () => {
      document.documentElement.setAttribute('data-user-interacted', 'true');
      // Pré-carrega o áudio após interação
      if (audioRef.current) {
        audioRef.current.load();
      }
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Verifica o status inicial e configura o polling
  useEffect(() => {
    let isMounted = true;

    const checkInitialStatus = async () => {
      try {
        const response = await api.get('/users/me');
        const isAvailable = response.data.isAvailable || false;
        
        if (isMounted) {
          setIsOnline(isAvailable);
          if (isAvailable) {
            startPolling();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status inicial:', error);
      }
    };

    checkInitialStatus();

    return () => {
      isMounted = false;
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  // Atualiza o polling quando o status online muda
  useEffect(() => {
    if (isOnline && !currentRide) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [isOnline, currentRide, startPolling, stopPolling]);

  // Atualizar a função handleAcceptRide
  const handleAcceptRide = async (rideId) => {
    try {
      const acceptedRide = await rideService.acceptRide(rideId);
      setCurrentRide(acceptedRide);
      setAvailableRides(rides => rides.filter(ride => ride._id !== rideId));
    } catch (error) {
      console.error('Erro ao aceitar corrida:', error);
      setError('Erro ao aceitar corrida');
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

      setTimeout(() => {
        if (isOnline) {
          startPolling();
        }
      }, 1000);

    } catch (error) {
      console.error('Erro ao finalizar corrida:', error);
      setError(error?.response?.data?.message || 'Erro ao finalizar corrida');
    }
  }, [currentRide, directionsRenderer, isOnline, startPolling]);

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

  // Atualizar a função de buscar corridas
  const fetchAvailableRides = useCallback(async () => {
    try {
      console.log('Buscando corridas disponíveis...');
      const rides = await rideService.getAvailableRides();
      console.log('Corridas recebidas:', rides);
      setAvailableRides(rides);
      setError('');
    } catch (error) {
      console.error('Erro ao buscar corridas:', error);
      setError('Erro ao buscar corridas disponíveis');
      setAvailableRides([]);
    }
  }, []);

  // Atualizar o useEffect para polling
  useEffect(() => {
    console.log('Iniciando polling de corridas...');
    fetchAvailableRides(); // Busca inicial

    const interval = setInterval(() => {
      console.log('Executando polling...');
      fetchAvailableRides();
    }, 5000); // Reduzido para 5 segundos para teste

    return () => {
      console.log('Limpando intervalo de polling');
      clearInterval(interval);
    };
  }, [fetchAvailableRides]);

  // Atualizar status da corrida
  const updateRideStatus = async (rideId, status) => {
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
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Botão de Status Online/Offline */}
          <div className="p-4 flex justify-end">
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
              className={`px-4 py-2 rounded-full font-medium ${
                isOnline 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div className="h-[400px] relative">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={currentLocation || defaultCenter}
              zoom={13}
              onLoad={onMapLoad}
              options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false
              }}
            >
              {currentLocation && (
                <Marker
                  position={currentLocation}
                  icon={{
                    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    scaledSize: new window.google.maps.Size(32, 32)
                  }}
                />
              )}
              {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>
          </div>

          <div className="p-4">
            {currentRide ? (
              <div className="space-y-4">
                <RideStatus ride={currentRide} />
                
                <div className="flex space-x-4">
                  {currentRide.status === 'accepted' && (
                    <button
                      onClick={() => updateRideStatus(currentRide._id, 'arrived')}
                      className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                      Cheguei ao Local
                    </button>
                  )}
                  
                  {currentRide.status === 'driver_arrived' && (
                    <button
                      onClick={() => updateRideStatus(currentRide._id, 'start')}
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Iniciar Corrida
                    </button>
                  )}
                  
                  {currentRide.status === 'in_progress' && (
                    <button
                      onClick={() => updateRideStatus(currentRide._id, 'complete')}
                      className="bg-purple-500 text-white px-4 py-2 rounded"
                    >
                      Finalizar Corrida
                    </button>
                  )}

                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat
                  </button>
                </div>

                {showChat && (
                  <RideChat rideId={currentRide._id} />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Corridas Disponíveis</h2>
                {availableRides.length === 0 ? (
                  <p className="text-gray-500">Nenhuma corrida disponível no momento</p>
                ) : (
                  <div className="grid gap-4">
                    {availableRides.map(ride => (
                      <div key={ride._id} className="border p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">De: {ride.origin.address}</p>
                            <p className="font-semibold">Para: {ride.destination.address}</p>
                            <p className="text-gray-600">Distância: {(ride.distance / 1000).toFixed(1)} km</p>
                            <p className="text-gray-600">Duração: {Math.round(ride.duration / 60)} min</p>
                            <p className="text-lg font-bold text-green-600">R$ {ride.price.toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => handleAcceptRide(ride._id)}
                            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                          >
                            Aceitar
                          </button>
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
    </div>
  );
} 