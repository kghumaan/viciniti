import React, { useRef } from 'react';
import { WebView } from 'react-native-webview';
import { Beacon } from '@shared/types/beacon';
import { MAPBOX_PUBLIC_TOKEN } from '@env';

// Base64-encoded optimized lighthouse icon (32x32px, 1.3KB)
const LIGHTHOUSE_ICON_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAE/UlEQVRYw91WW29UVRT+9mXOnDkznWuZ ttALFGihWFAREuOtVWIFTURRSwETMT5rYmL8DT4YTYyPBBMotAgEY4ytodJoCCFAAbG1N6Gl9MpMp9OZ aefc9vZhTO0oImVGTFxPa53L2t9el28tgiXI3sZdWXZz6wnkKhT/sZC/e7G78Y0su6X1WJZdURzK8jA8 Hn1wEagqLcLwRBQ1K1egpnw5hsejqCotenAA+m9NorF+C9K6sT1tmNtfr9uC/luT9wWAL+Xj0nAAa5aH YdoCrWcu0G2ba94CIL/svND2ZO1a6eAMvSPjGI/Ec6+BP8v6lcuxsbIMk7E4knO65nWr7wY86odSSsyk 9I9S8+nPNNWZKgn5cWXwJnqGxu7JL7tXAJGZBCqKQtBNq7xAc35cEnC/t35FUAv7NNWwRL0tSYVp211C ivjP18egm1buEWh6beeCPtLfAymlX3MqzQ7OdgQ8KhyMggDQLRszKR2mZbel0voeQhA7e20wvzUgpYBu WClGSGd1dXnDrpefYoxRAASWZaHleKfo7Rv+Ma0bSdWp/JXE9u7N9keWCICAwOfRzNnE3NVQ0Gs//XgN ow4OEApLN9B++oLQdfNawOsx07oBANizu/GPA4UAofT+21Bx8Gw4lAKEAoQsSqSUAKAojjuEUCw9BUeP n1rQn3m4GkLIoFtTd4yNR9mJr8+B0kwNmJaFqdszVHOpDbppnmWUxvLCA02vvLigTwz9ClCEHZw1xOMJ 9v2ZS5C/X5oQglQqTTlndbYpCwkhdwTQ3Nx8/0UYS8zhqU1VvT8NjnxVX/foujebtkHYNiAFKOM43NKB o62nT60pLRq42HcDAHCkpTV/XTARi6O0MIDu66O+wqAX7gINsO1M/hUnwuEAGGM+j+bCaCSWfyoOeT34 5Fg727imfJnbrUKfSyM6ncDtSBzjkzFcvjoIymj4UNsPtDgUENF4Kr9UvLl6JaSUrmX+gm+qq8rrnU4F 8/M6GGPw+92wLBtdl/s7RqemX+Kcpbv6h+/qb//+/UuLgIMzmKalKooS2PhQJWo3rEI4HITfp8HrVtHT N4LunqEAp9TldPB03lPAGYNlWB6Px+V9fttjKKsozgTQtgBIFBRoUFXFzyhxc5anNsyaWpSAEBS4XE6P pqkZArIF9LSJRDKFsYlpAPBwzr2MMvwLACg45z4hpKvrygBmZpK4NRrB1O0Yksl52LZAOq1risL9mRlx dzl48ODSAFBKoTh4cHY26fyu4xKWFfqwoqQQj2xajeJwAB6PC59+ftJ57nx3SHHz/EagsiQERinmLDtU u6HS8cH7jWCUov30RczOJvHE1nXgnMHvczsIIYWMUpQXBXBzMpY7gOc218AWApxRUEJCwaCXuL0aBvtG 8MWhtsy2VFWGtdVl8HndIJQUckaxqiSMtaXF6Lj0S24bUUVRCELKItsWTZzRnZpbXZ2YnUPX5QH0D4zA tgSEBEZHI+juvYmpqRg1LEuxpRyFRGpoIvrPRLRv356sh4cPH1nQX9haC8Oy3g4WuA74NCeklJCZqQtK CCSwYBNCQAhBfE7HdGL+HcXBD7Sdv5ZbCoSUkBJRw7THkvOGUyIzBO92KcO0dSkREULmXgPJ+TSklN/q pvWsEFLBIgByEZcvOoowSgxbiBvEyBsPEINR0scphYS8pz+EyKxxOQ+jVxvqsuyT7Z34X8lvjOICUBDm TJkAAAAASUVORK5CYII=';

interface MapViewProps {
  location: {
    latitude: number;
    longitude: number;
  };
  beacons: Beacon[];
  isDarkMode: boolean;
  onBeaconPress: (beacon: Beacon) => void;
  allowPinDrop?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  location,
  beacons,
  isDarkMode,
  onBeaconPress,
  allowPinDrop = false,
}) => {
  const webViewRef = useRef<WebView>(null);

  const formatBeaconsForMap = () => {
    return beacons.map(beacon => ({
      name: beacon.title,
      type: beacon.category,
      latitude: beacon.location.latitude,
      longitude: beacon.location.longitude,
      id: beacon.id,
      imageUri: beacon.beaconImage
    }));
  };

  const generateMapboxHTML = () => {
    const mapStyle = isDarkMode ? 'mapbox://styles/mapbox/dark-v10' : 'mapbox://styles/mapbox/streets-v11';
    const markersJSON = JSON.stringify(formatBeaconsForMap());
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
        <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; }
          #map { position: absolute; top: 0; bottom: 0; width: 100%; }
          .lighthouse-marker {
            width: 32px;
            height: 32px;
            cursor: pointer;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transition: transform 0.2s ease;
          }
          .lighthouse-marker:hover {
            transform: scale(1.1);
          }
          .lighthouse-marker img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
          }
          .popup {
            max-width: 200px;
            padding: 5px;
          }
          .popup-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .popup-subtitle {
            color: #666;
            font-size: 12px;
          }
          .create-beacon-prompt {
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 20px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 14px;
            position: absolute;
            bottom: 70px;
            left: 50%;
            transform: translateX(-50%);
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            z-index: 10;
            text-align: center;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          mapboxgl.accessToken = '${MAPBOX_PUBLIC_TOKEN}';
          
          const map = new mapboxgl.Map({
            container: 'map',
            style: '${mapStyle}',
            center: [${location.longitude}, ${location.latitude}],
            zoom: 14
          });
          
          // Add user's location marker
          const userMarker = new mapboxgl.Marker({
            color: '#3498db',
            draggable: ${allowPinDrop} // Only allow dragging when pin dropping is enabled
          })
            .setLngLat([${location.longitude}, ${location.latitude}])
            .addTo(map);
            
          // Store the marker in the window object so it can be accessed from outside
          window.userMarker = userMarker;
          
          // If marker is draggable, add dragend event
          if (${allowPinDrop}) {
            userMarker.on('dragend', () => {
              const lngLat = userMarker.getLngLat();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapClick',
                location: {
                  latitude: lngLat.lat,
                  longitude: lngLat.lng
                }
              }));
            });
          }
          
          // Add beacon markers with lighthouse icons
          const beacons = ${markersJSON};
          beacons.forEach(beacon => {
            // Create a custom HTML element for the lighthouse marker
            const el = document.createElement('div');
            el.className = 'lighthouse-marker';
            
            const img = document.createElement('img');
            img.src = '${LIGHTHOUSE_ICON_BASE64}';
            img.alt = 'Beacon';
            el.appendChild(img);
            
            const marker = new mapboxgl.Marker({
              element: el
            })
              .setLngLat([beacon.longitude, beacon.latitude])
              .addTo(map);
            
            marker.getElement().addEventListener('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'beaconPress',
                beaconId: beacon.id
              }));
            });
          });
          
          // Create a variable to store the create prompt element
          let createPrompt = null;
          
          // Only setup pin dropping functionality if allowPinDrop is true
          const allowPinDrop = ${allowPinDrop};
          
          if (allowPinDrop) {
            // Add long press event listener to the map for dropping a new beacon
            let pressTimer = null;
            let pressCoordinates = null;
            let longPressDuration = 500; // milliseconds
            
            map.on('mousedown', (e) => {
              pressCoordinates = e.lngLat;
              pressTimer = setTimeout(() => {
                // Long press detected
                // Update the marker position
                userMarker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
                
                // Show the "Drop new beacon?" prompt
                if (createPrompt) {
                  document.body.removeChild(createPrompt);
                }
                
                createPrompt = document.createElement('div');
                createPrompt.className = 'create-beacon-prompt';
                createPrompt.textContent = 'Drop new beacon?';
                createPrompt.addEventListener('click', () => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'createBeacon',
                    location: {
                      latitude: e.lngLat.lat,
                      longitude: e.lngLat.lng
                    }
                  }));
                });
                
                document.body.appendChild(createPrompt);
                
                // Send long press event to React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'mapLongPress',
                  location: {
                    latitude: e.lngLat.lat,
                    longitude: e.lngLat.lng
                  }
                }));
              }, longPressDuration);
            });
            
            map.on('mouseup', () => {
              clearTimeout(pressTimer);
              pressTimer = null;
              pressCoordinates = null;
            });
            
            map.on('mousemove', () => {
              if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
              }
            });
            
            map.on('touchend', () => {
              clearTimeout(pressTimer);
              pressTimer = null;
              pressCoordinates = null;
            });
            
            map.on('touchmove', () => {
              if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
              }
            });
          }
          
          // Add click event listener to the map for selecting a location
          map.on('click', (e) => {
            // Only update the marker position if pin dropping is allowed
            if (allowPinDrop) {
              userMarker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapClick',
                location: {
                  latitude: e.lngLat.lat,
                  longitude: e.lngLat.lng
                }
              }));
            }
          });
        </script>
      </body>
      </html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'beaconPress') {
        const beacon = beacons.find(b => b.id === data.beaconId);
        if (beacon) {
          onBeaconPress(beacon);
        }
      } else if (data.type === 'mapClick' && allowPinDrop) {
        // Only create temporary beacons if pin dropping is allowed
        // Create a temporary beacon object for the location
        const mapClickBeacon = {
          id: 'map-click',
          title: 'Selected Location',
          description: 'You selected this location',
          category: 'Food & Drink',
          location: data.location,
          startTime: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          attendees: [] as Array<{id: string, name: string, avatar?: string}>,
          endTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        };
        onBeaconPress(mapClickBeacon);
      } else if ((data.type === 'mapLongPress' || data.type === 'createBeacon') && allowPinDrop) {
        // Only create new beacon prompts if pin dropping is allowed
        // Create a temporary beacon object for the long press location
        const longPressBeacon = {
          id: 'new-beacon',
          title: 'New Beacon',
          description: 'Create a new beacon at this location',
          category: 'Food & Drink',
          location: data.location,
          startTime: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          attendees: [] as Array<{id: string, name: string, avatar?: string}>,
          endTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
          isNewBeaconPrompt: true // Flag to indicate this is a new beacon prompt
        };
        onBeaconPress(longPressBeacon);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ html: generateMapboxHTML() }}
      style={{ flex: 1 }}
      onMessage={handleMessage}
      javaScriptEnabled={true}
    />
  );
}; 