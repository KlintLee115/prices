"use client"

import { GoogleMap, Marker } from '@react-google-maps/api';
import { useSearchParams } from 'next/navigation';

const containerStyle = {
    width: '500px',
    height: '500px'
};

const markers = [
    {
        name: "location-1",
        location: {
            lat: 51.0672697,
            lng: -114.0863437
        }
    },
    {
        name: "location-2",
        location: {
            lat: 51.06026560000001,
            lng: -114.0794573
        }

    },
    {
        name: "location-3",
        location: {
            lat: 3.1480679,
            lng: -114.0794573
        }

    }
]

export default function Maps() {

    const searchParams = useSearchParams()

    const strLat = searchParams.get('lat')
    const strLng = searchParams.get('lng')

    const lat = strLat ? parseFloat(strLat) : 51.057166438
    const lng = strLng ? parseFloat(strLng) : -114.088166314

    const center = {
        lat: lat,
        lng: lng
    };

    return <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
    >
        {markers.map(marker => {
            return <div key={marker.name}>
                <Marker position={marker.location} options={{ icon: '/download.jpg' }} />
            </div>
        })}
    </GoogleMap>

}