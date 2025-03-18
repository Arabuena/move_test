import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import AddressAutocomplete from '../components/AddressAutocomplete';
import api from '../services/api';
import RideStatus from '../components/RideStatus';
import { useNavigate } from 'react-router-dom';
import RideChat from '../components/RideChat';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_LIBRARIES = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: -23.550520, // São Paulo
  lng: -46.633308
};

export default function RequestRide() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [price, setPrice] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();
  const mapRef = useRef(null);

  // Adicione isso no início do componente para debug
  useEffect(() => {
    console.log('RequestRide montado');
    console.log('Google Maps API Key:', GOOGLE_MAPS_API_KEY);
    console.log('Bibliotecas carregadas:', GOOGLE_MAPS_LIBRARIES);
  }, []);

  // Defina renderMarker usando useCallback antes de usá-lo
  const renderMarker = useCallback((position) => {
    if (!position || !window.google || !mapRef.current) return null;

    return new window.google.maps.marker.AdvancedMarkerElement({
      position,
      title: "Sua localização",
      map: mapRef.current
    });
  }, []);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    
    if (currentLocation) {
      renderMarker(currentLocation);
    }
  }, [currentLocation, renderMarker]);

  useEffect(() => {
    let marker = null;

    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setOrigin(location);

          if (marker) {
            marker.setMap(null);
          }
          marker = renderMarker(location);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setError('Não foi possível obter sua localização');
        }
      );
    }

    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [renderMarker]);

  // Busca a corrida ativa ao carregar a página
  useEffect(() => {
    const fetchCurrentRide = async () => {
      try {
        console.log('Buscando corrida atual...');
        const response = await api.get('/rides/current');
        console.log('Resposta da corrida atual:', response.data);
        
        if (response.data) {
          setCurrentRide(response.data);
          
          // Se tiver uma corrida ativa, busca as direções
          if (response.data.status !== 'completed' && response.data.status !== 'cancelled') {
            const directionsService = new window.google.maps.DirectionsService();
            
            const origin = {
              lat: response.data.origin.coordinates[1],
              lng: response.data.origin.coordinates[0]
            };
            
            const destination = {
              lat: response.data.destination.coordinates[1],
              lng: response.data.destination.coordinates[0]
            };

            const result = await directionsService.route({
              origin,
              destination,
              travelMode: window.google.maps.TravelMode.DRIVING
            });

            setDirections(result);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar corrida:', error);
        setError('Erro ao buscar corrida atual');
      }
    };

    fetchCurrentRide();
  }, []);

  // Atualiza rota quando origem ou destino mudam
  useEffect(() => {
    if (origin && destination && window.google) {
      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            setDirections(result);
            
            // Pega distância e duração
            const route = result.routes[0];
            const leg = route.legs[0];
            setDistance(leg.distance.value); // metros
            setDuration(leg.duration.value); // segundos

            // Calcula preço estimado
            const basePrice = 2;
            const pricePerKm = 2;
            const pricePerMin = 0.25;
            
            const distancePrice = (leg.distance.value / 1000) * pricePerKm;
            const durationPrice = (leg.duration.value / 60) * pricePerMin;
            const totalPrice = basePrice + distancePrice + durationPrice;
            
            setPrice(Math.round(totalPrice * 100) / 100);
          } else {
            console.error('Erro ao calcular rota:', status);
            setError('Erro ao calcular rota');
          }
        }
      );
    }
  }, [origin, destination]);

  const handleRequestRide = async (e) => {
    e.preventDefault();
    
    try {
      if (!origin || !destination) {
        setError('Selecione origem e destino');
        return;
      }

      setLoading(true);
      setError('');

      const rideData = {
        origin: {
          coordinates: [origin.lng, origin.lat],
          address: origin.formatted_address || origin.name
        },
        destination: {
          coordinates: [destination.lng, destination.lat],
          address: destination.formatted_address || destination.name
        },
        distance,
        duration,
        price
      };

      console.log('Enviando solicitação:', rideData);

      const response = await api.post('/rides', rideData);
      console.log('Corrida criada:', response.data);

      // Redireciona para a página de acompanhamento
      navigate(`/rides/${response.data._id}`);
    } catch (error) {
      console.error('Erro ao solicitar corrida:', error);
      setError(error.response?.data?.message || 'Erro ao solicitar corrida');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    try {
      await api.post(`/rides/cancel/${currentRide._id}`);
      setCurrentRide(null);
    } catch (err) {
      setError('Erro ao cancelar corrida');
      console.error(err);
    }
  };

  return (
    <div className="h-full relative">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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
            >
              {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>
          </div>

          {/* Painel lateral */}
          <div className={`w-full md:w-[400px] bg-white shadow-lg relative ${showChat ? 'h-full' : ''}`}>
            {currentRide ? (
              <>
                {showChat ? (
                  // Chat da corrida
                  <div className="h-full">
                    <div className="p-4 border-b flex items-center justify-between">
                      <button
                        onClick={() => setShowChat(false)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="font-semibold">Chat da Corrida</span>
                      <div className="w-6" /> {/* Espaçador */}
                    </div>
                    <RideChat />
                  </div>
                ) : (
                  // Status da corrida
                  <div className="p-4">
                    <RideStatus 
                      ride={currentRide} 
                      onCancel={handleCancelRide} 
                    />
                    <button
                      onClick={() => setShowChat(true)}
                      className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Conversar com Motorista
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Formulário de solicitação de corrida
              <div className="p-4">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Solicitar Corrida
                </h1>

                <div className="mt-6">
                  <form onSubmit={handleRequestRide} className="space-y-4">
                    <div>
                      <AddressAutocomplete
                        placeholder="Origem"
                        onSelect={setOrigin}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <AddressAutocomplete
                        placeholder="Destino"
                        onSelect={setDestination}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {price && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900">Detalhes da viagem</h3>
                        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Distância</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {(distance / 1000).toFixed(1)} km
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Tempo estimado</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {Math.round(duration / 60)} min
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Preço estimado</dt>
                            <dd className="mt-1 text-2xl font-semibold text-gray-900">
                              R$ {price.toFixed(2)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    )}

                    {error && (
                      <div className="text-red-500 text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !origin || !destination}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? 'Solicitando...' : 'Solicitar Corrida'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 