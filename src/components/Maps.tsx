"use client"

import { GoogleMap, InfoWindow, Marker } from '@react-google-maps/api';
import { useSearchParams } from 'next/navigation';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { getCurrentLocation } from './SearchItem';

export type MarkerType = {
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

export default function Maps({currMarker, setSelectedMarker}:{currMarker: MarkerType | null, setSelectedMarker: Dispatch<SetStateAction<MarkerType | null>>}) {

    const [markers, setMarkers] = useState<MarkerType[]>()
    const [currLocation, setCurrLocation] = useState<{ lat: number, lng: number }>()
    const searchParams = useSearchParams()

    useEffect(() => {

        (async () => {
            setCurrLocation(await getCurrentLocation())
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

    if (currLocation) {

        const strLat = searchParams.get('lat')
        const strLng = searchParams.get('lng')

        const lat = strLat ? parseFloat(strLat) : currLocation?.lat
        const lng = strLng ? parseFloat(strLng) : currLocation?.lng

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
                    <Marker position={marker.location} options={{ icon: '/download.jpg' }} onClick={() => setSelectedMarker(marker)} />
                </div>
            })}
            {currMarker && (
                <InfoWindow
                    position={currMarker.location}
                    onCloseClick={() => setSelectedMarker(null)}
                >
                    <p>{currMarker.name}</p>
                </InfoWindow>)}
        </GoogleMap>
    }
    else return <></>
}