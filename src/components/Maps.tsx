"use client"

import { GoogleMap, Marker } from '@react-google-maps/api';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type MarkerType = {
    name: string,
    location: {
        lat: number,
        lng: number
    }
}

const containerStyle = {
    width: '500px',
    height: 'inherit'
};

export default function Maps() {

    const [markers, setMarkers] = useState<MarkerType[]>()

    useEffect(() => {
        (async () => {
            const response = await fetch('/api/')
            const data: any[] = await response.json()

            setMarkers(_ => {
                const updatedData: MarkerType[] = []
                data.forEach(item => {
                    const newData: MarkerType = {
                        location: {
                            lng: item.location.coordinates[0],
                            lat: item.location.coordinates[1]
                        },
                        name: item.address
                    }

                    updatedData.push(newData)
                })
                return updatedData
            })

        })()
    }, [])


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
        {markers && markers.map(marker => {
            return <div key={marker.name}>
                <Marker position={marker.location} options={{ icon: '/download.jpg' }} />
            </div>
        })}
    </GoogleMap>

}