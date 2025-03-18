import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { LoadScript, GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';

// Constantes que podem ficar fora do componente
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_LIBRARIES = ['places'];
const CONNECTION_CHECK_INTERVAL = 10000;
const MAX_RETRIES = 3;
const mapContainerStyle = {
  width: '100%',
  height: '100%'
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

export default function DriverDashboard() {
  // Estados
  const [isOnline, setIsOnline] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  const [availableRide, setAvailableRide] = useState(null);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [rideStatus, setRideStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [declinedRideId, setDeclinedRideId] = useState(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Refs
  const mapRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const audioRef = useRef(null);
  const DECLINE_TIMEOUT = 45000;

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
        const ride = response.data[0];
        if (ride._id !== declinedRideId) {
          setAvailableRide(ride);
          playNotification();
        }
      }
    } catch (error) {
      console.error('Erro ao buscar corridas:', error);
    }
  }, [isOnline, currentRide, declinedRideId, playNotification]);

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
      // Limpa rota anterior se existir
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }

      // Cria novo DirectionsService e DirectionsRenderer
      const directionsService = new window.google.maps.DirectionsService();
      const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: false,
        preserveViewport: false
      });

      // Solicita a rota
      const result = await directionsService.route(routeData);
      
      // Atualiza a rota no mapa
      newDirectionsRenderer.setDirections(result);
      setDirectionsRenderer(newDirectionsRenderer);
      setDirections(result);

      // Ajusta o zoom para mostrar toda a rota
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
      setAvailableRide(null); // Limpa qualquer corrida disponível ao parar
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
          const ride = response.data[0];
          if (ride._id !== declinedRideId) {
            setAvailableRide(ride);
            playNotification();
          }
        } else {
          setAvailableRide(null);
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 5000);
  }, [isOnline, currentRide, declinedRideId, playNotification, stopPolling]);

  // 3. Depois o useEffect que usa ambas as funções
  useEffect(() => {
    const loadCurrentRide = async () => {
      try {
        const response = await api.get('/rides/current');
        if (response.data) {
          const currentRide = response.data;
          setCurrentRide(currentRide);
          setRideStatus(currentRide.status);
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

  // Handler para alternar status online/offline
  const handleStatusToggle = async () => {
    try {
      const newStatus = !isOnline;
      console.log('Alterando status para:', newStatus);
      
      await api.patch('/users/availability', { isAvailable: newStatus });
      setIsOnline(newStatus);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  // Modifique o useEffect de verificação de conexão
  useEffect(() => {
    let retryCount = 0;
    
    const checkConnection = async () => {
      try {
        console.log('Verificando conexão...');
        const response = await api.get('/users/me');
        console.log('Resposta recebida:', response.data);
        
        setIsConnected(true);
        setError('');
        retryCount = 0;
      } catch (error) {
        console.error('Erro completo:', error);
        
        // Erro de autenticação
        if (error.response?.status === 401) {
          setError('Sessão expirada. Por favor, faça login novamente.');
          // Aqui você pode redirecionar para a página de login
          return;
        }
        
        // Erro de conexão
        if (error.code === 'ERR_NETWORK') {
          setError('Não foi possível conectar ao servidor. Verificando conexão...');
        } else {
          setError(`Erro ao verificar conexão: ${error.response?.data?.message || error.message}`);
        }
        
        retryCount++;
        setIsConnected(false);
        
        if (retryCount >= MAX_RETRIES) {
          setIsOnline(false);
        }
      }
    };

    // Verifica imediatamente
    checkConnection();
    
    // Configura o intervalo
    const interval = setInterval(checkConnection, CONNECTION_CHECK_INTERVAL);

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Atualizar a função handleAcceptRide
  const handleAcceptRide = async () => {
    try {
      const response = await api.post(`/rides/accept/${availableRide._id}`);
      
      // Processa os dados da corrida antes de atualizar a rota
      const rideData = processRideData(availableRide);
      if (!rideData) return;

      // Atualiza a rota com os dados processados (false = rota até o passageiro)
      await updateMapRoute(rideData);
      
      setCurrentRide(response.data);
      setRideStatus('accepted');
      setAvailableRide(null);
      stopPolling();

    } catch (error) {
      console.error('Erro ao aceitar corrida:', error);
      setError('Erro ao aceitar corrida');
    }
  };

  // Atualizar a função handleStartRide
  const handleStartRide = async () => {
    try {
      const response = await api.post(`/rides/start/${currentRide._id}`);
      
      // Processa os dados novamente para a rota até o destino
      const rideData = processRideData(currentRide);
      if (!rideData) return;

      // Atualiza a rota para o destino (true = rota até o destino)
      await updateMapRoute(rideData);
      
      setCurrentRide(response.data);
      setRideStatus('in_progress');
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
      
      // Limpa todos os estados relacionados à corrida
      setCurrentRide(null);
      setRideStatus(null);
      setDirections(null);
      setAvailableRide(null);
      
      // Limpa o renderer do mapa
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
        setDirectionsRenderer(null);
      }

      // Adiciona mensagem de sucesso
      setError('Corrida finalizada com sucesso!');
      
      // Limpa a mensagem após 3 segundos
      setTimeout(() => {
        setError('');
      }, 3000);

      // Aguarda um momento antes de reiniciar o polling
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

  // Função para recusar corrida
  const handleDeclineRide = () => {
    if (!availableRide) return;
    
    // Limpa os timers atuais
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    
    setDeclinedRideId(availableRide._id);
    setAvailableRide(null);

    setTimeout(() => {
      setDeclinedRideId(null);
    }, DECLINE_TIMEOUT);
  };

  // Atualizar o componente CurrentRideDetailsComponent
  const CurrentRideDetailsComponent = ({ ride, status, onComplete, onStart }) => {
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

    const openGpsNavigation = () => {
      // Coordenadas do destino baseadas no status da corrida
      const destination = status === 'accepted' 
        ? ride.origin.coordinates  // Se acabou de aceitar, navega até o passageiro
        : ride.destination.coordinates; // Se já pegou o passageiro, navega até o destino final
      
      // Inverte as coordenadas pois o MongoDB armazena como [lng, lat] e as APIs de navegação usam [lat, lng]
      const [lng, lat] = destination;
      
      // Cria URLs para diferentes apps de navegação
      const navigationApps = {
        'Google Maps': `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        'Waze': `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`,
        // Outros apps podem ser adicionados aqui
      };

      // Cria o menu de seleção
      const app = window.confirm(
        'Escolha o app de navegação:\n\n' +
        'OK - Google Maps\n' +
        'Cancelar - Waze'
      );

      // Abre o app escolhido
      const url = app ? navigationApps['Google Maps'] : navigationApps['Waze'];
      window.open(url, '_blank');
    };

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Painel de detalhes expansível - Movido para antes do botão principal */}
        <div className={`bg-white shadow-lg transition-transform duration-300 ease-in-out transform ${
          isDetailsExpanded ? 'translate-y-0' : 'translate-y-full'
        }`}>
          {isDetailsExpanded && (
            <div className="p-6">
              <div className="max-w-xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {status === 'accepted' ? 'Indo buscar passageiro' : 'Em viagem'}
                  </h3>
                  <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {status === 'accepted' ? 'A caminho' : 'Em andamento'}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <p className="text-sm text-gray-500">Passageiro</p>
                      <p className="text-gray-900 font-medium">{ride.passenger.name}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        {status === 'accepted' ? 'Local de embarque' : 'Destino'}
                      </p>
                      <p className="text-gray-900">
                        {status === 'accepted' ? ride.origin.address : ride.destination.address}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Distância</p>
                      <p className="text-gray-900 font-medium">
                        {(ride.distance / 1000).toFixed(1)} km
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Tempo est.</p>
                      <p className="text-gray-900 font-medium">
                        {Math.round(ride.duration / 60)} min
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Valor</p>
                      <p className="text-green-600 font-semibold">
                        R$ {ride.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botão para expandir/colapsar */}
        <button
          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
          className="absolute -top-8 right-4 bg-white rounded-t-lg px-4 py-1 text-sm text-gray-600 shadow-lg"
        >
          {isDetailsExpanded ? '▼ Minimizar' : '▲ Detalhes'}
        </button>

        {/* Botões principais */}
        <div className="bg-white shadow-lg p-4 flex justify-center space-x-4">
          {/* Botão de navegação GPS */}
          <button
            onClick={openGpsNavigation}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Abrir GPS
          </button>

          {/* Botão de iniciar/finalizar */}
          <button
            onClick={status === 'accepted' ? onStart : onComplete}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            {status === 'accepted' ? 'Iniciar Corrida' : 'Finalizar Corrida'}
          </button>
        </div>
      </div>
    );
  };

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

  return (
    <div className="h-screen flex flex-col">
      <LoadScript 
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={GOOGLE_MAPS_LIBRARIES}
      >
        <div className="flex-1 relative">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={14}
            center={currentLocation || { lat: -23.550520, lng: -46.633308 }}
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

          {/* Botão de status */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleStatusToggle}
              disabled={!isConnected}
              className={`px-4 py-2 rounded-lg font-medium ${
                !isConnected 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : isOnline 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } transition-colors`}
            >
              {!isConnected 
                ? 'Servidor Indisponível' 
                : isOnline 
                  ? 'Online' 
                  : 'Offline'}
            </button>
          </div>

          {/* Indicador de status do servidor */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
            <div 
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
              }`}
            />
            <span className="text-sm text-gray-700">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {/* Corrida disponível */}
          {availableRide && !currentRide && (
            <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-3xl p-6 animate-slide-up z-30">
              <div className="max-w-xl mx-auto">
                <h3 className="text-lg font-semibold mb-4">Nova solicitação de corrida!</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Origem:</span> {availableRide.origin.address}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Destino:</span> {availableRide.destination.address}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Distância</p>
                      <p className="text-sm text-gray-900">{(availableRide.distance / 1000).toFixed(1)} km</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Tempo est.</p>
                      <p className="text-sm text-gray-900">{Math.round(availableRide.duration / 60)} min</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Valor</p>
                      <p className="text-lg font-semibold text-green-600">
                        R$ {availableRide.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleAcceptRide}
                    className="flex-1 bg-green-500 text-white py-4 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
                  >
                    Aceitar Corrida
                  </button>
                  <button
                    onClick={handleDeclineRide}
                    className="flex-1 bg-gray-200 text-gray-800 py-4 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Detalhes da corrida atual */}
          {currentRide && (
            <CurrentRideDetailsComponent 
              ride={currentRide}
              status={rideStatus}
              onComplete={handleCompleteRide}
              onStart={handleStartRide}
            />
          )}

          {/* Mensagem de erro */}
          {error && (
            <div className="absolute top-20 left-0 right-0 mx-4 z-40">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            </div>
          )}
        </div>
      </LoadScript>
    </div>
  );
} 