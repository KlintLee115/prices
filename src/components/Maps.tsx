"use client"

import { GoogleMap, InfoWindow, Marker } from '@react-google-maps/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { getCurrentLocation } from './SearchItem';
import { BasePricesResponseType } from '@/lib/general';

export type MarkerType = {
    name: string,
    lat: number,
    lng: number
}

const containerStyle = {
    width: '500px',
    height: 'inherit'
};

export default function Maps({ currMarker, setSelectedMarker }: { currMarker: MarkerType | null, setSelectedMarker: Dispatch<SetStateAction<MarkerType | null>> }) {

    const [markers, setMarkers] = useState<MarkerType[]>()
    const [currLocation, setCurrLocation] = useState<{ lat: number, lng: number }>()
    const searchParams = useSearchParams()
    const router = useRouter()
    const newSearchParams = new URLSearchParams(useSearchParams())

    useEffect(() => {

        try {

            (async () => {
                setCurrLocation(await getCurrentLocation())
                const response = await fetch(`http://localhost:3000/getPricesData`)
                const data: { error: string } | BasePricesResponseType[] = await response.json()

                if (response.status === 500 && !(Array.isArray(data))) {
                    throw ((data as { error: string }).error)
                }

                setMarkers(_ => {
                    const displayedData: MarkerType[] = [];
                    (data as BasePricesResponseType[]).forEach((item: BasePricesResponseType) => {
                        const newData: MarkerType = {
                            lng: parseFloat(item.lng),
                            lat: parseFloat(item.lat),
                            name: item.address
                        }

                        displayedData.push(newData)
                    })
                    return displayedData
                })

            })()
        }
        catch (err) {
            throw (err)
        }
    }, [searchParams.get('radius')])

    if (currLocation) {

        try {
            const strLat = searchParams.get('lat')
            const strLng = searchParams.get('lng')

            const lat = strLat ? parseFloat(strLat) : currLocation?.lat
            const lng = strLng ? parseFloat(strLng) : currLocation?.lng

            const center = {
                lat, lng
            };

            return <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={15}
            >
                {markers && markers.map(marker => {
                    return <div key={marker.name}>
                        <Marker position={{
                            lat: marker.lat,
                            lng: marker.lng
                        }} options={{ icon: '/download.jpg' }} onClick={() => {
                            newSearchParams.set('lat', marker.lat.toString())
                            newSearchParams.set('lng', marker.lng.toString())
                            setSelectedMarker(null)
                            router.push(`/?${newSearchParams.toString()}`)
                        }} />
                    </div>
                })}
                {currMarker && (
                    <InfoWindow
                        position={{
                            lat: currMarker.lat,
                            lng: currMarker.lng
                        }}
                        onCloseClick={() => setSelectedMarker(null)}
                    >
                        <p>{currMarker.name}</p>
                    </InfoWindow>)}
            </GoogleMap>
        }

        catch (err) {
            throw err
        }
    }
    else return <></>
}