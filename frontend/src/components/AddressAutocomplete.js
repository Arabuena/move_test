import React, { useEffect, useRef } from 'react';

export default function AddressAutocomplete({ placeholder, onSelect, className }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!window.google) {
      console.error('Google Maps não está carregado');
      return;
    }

    // Inicializa o autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'br' },
      fields: ['geometry', 'formatted_address']
    });

    // Adiciona listener para quando um lugar é selecionado
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      
      if (!place.geometry) {
        console.error('Lugar selecionado não tem geometria');
        return;
      }

      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        formatted_address: place.formatted_address,
        name: place.name
      };

      onSelect(location);
    });

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className={className}
    />
  );
} 