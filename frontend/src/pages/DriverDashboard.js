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
  const [audio] = useState(new Audio('/sounds/notification.mp3'));
  const [lastRideCount, setLastRideCount] = useState(0);

  // Simplificar a função de notificação
  const playNotification = useCallback(() => {
    try {
      // Reseta o áudio para o início
      audio.currentTime = 0;
      
      // Tenta tocar o som
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Erro ao tocar áudio:', error);
          // Se falhar, tenta tocar após interação do usuário
          const handleUserInteraction = () => {
            audio.play();
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
          };
          document.addEventListener('click', handleUserInteraction);
          document.addEventListener('touchstart', handleUserInteraction);
        });
      }
    } catch (error) {
      console.error('Erro ao tocar notificação:', error);
    }
  }, [audio]);

  // Configurar o áudio quando o componente montar
  useEffect(() => {
    audio.preload = 'auto';
    audio.volume = 1.0;
    
    // Tenta pré-carregar o áudio
    const loadAudio = () => {
      const loadPromise = audio.load();
      if (loadPromise !== undefined) {
        loadPromise.catch(error => {
          console.error('Erro ao carregar áudio:', error);
        });
      }
    };
    loadAudio();

    return () => {
      audio.pause();
    };
  }, [audio]);

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
      if (audio) {
        audio.load();
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
      const shouldAccept = window.confirm('Deseja aceitar esta corrida?');
      if (!shouldAccept) return;

      setLoading(true);
      const acceptedRide = await rideService.acceptRide(rideId);
      setCurrentRide(acceptedRide);
      setAvailableRides([]);
      
      // Parar o polling quando aceitar uma corrida
      setLastRideCount(0);
      
      // Calcular rota
      if (acceptedRide.origin?.coordinates) {
        calculateRoute(acceptedRide.origin.coordinates);
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
    if (!isOnline) return;

    try {
      console.log('Buscando corridas disponíveis...');
      const rides = await rideService.getAvailableRides();
      
      // Tocar notificação se houver novas corridas
      if (rides.length > lastRideCount) {
        console.log('Nova corrida encontrada, tocando notificação');
        playNotification();
      }
      
      setLastRideCount(rides.length);
      setAvailableRides(rides);
      setError('');
    } catch (error) {
      console.error('Erro ao buscar corridas:', error);
      setError('Erro ao buscar corridas disponíveis');
      setAvailableRides([]);
    }
  }, [isOnline, lastRideCount, playNotification]);

  // Atualizar o useEffect para polling com intervalo maior
  useEffect(() => {
    let intervalId;

    if (isOnline && !currentRide) {
      console.log('Iniciando polling de corridas...');
      fetchAvailableRides(); // Busca inicial

      intervalId = setInterval(() => {
        console.log('Executando polling...');
        fetchAvailableRides();
      }, 15000); // Aumentado para 15 segundos
    }

    return () => {
      if (intervalId) {
        console.log('Limpando intervalo de polling');
        clearInterval(intervalId);
      }
    };
  }, [fetchAvailableRides, isOnline, currentRide]);

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

  // Adicionar função calculateRoute
  const calculateRoute = useCallback(async (destination) => {
    if (!currentLocation || !destination) return;

    const directionsService = new window.google.maps.DirectionsService();

    try {
      const result = await directionsService.route({
        origin: currentLocation,
        destination: {
          lat: destination[1],
          lng: destination[0]
        },
        travelMode: window.google.maps.TravelMode.DRIVING
      });

      setDirections(result);

      // Se já existe um DirectionsRenderer, atualize-o
      if (directionsRenderer) {
        directionsRenderer.setDirections(result);
      } else {
        // Caso contrário, crie um novo
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

  // Atualizar localização atual
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);

          // Se estiver em uma corrida, recalcular rota
          if (currentRide?.origin?.coordinates) {
            calculateRoute(currentRide.origin.coordinates);
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setError('Não foi possível obter sua localização');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [currentRide, calculateRoute]);

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
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
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
            <p className="text-xs text-gray-500">Última atualização: {new Date().toLocaleTimeString()}</p>
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