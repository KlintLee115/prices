"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useEffect, useState } from "react";

type SearchItemsProp = {
    lat?: number;
    lng?: number;
    product?: string;
}

export async function getCurrentLocation(): Promise<{ lat: number, lng: number }> {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            position => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                resolve(pos);
            },
            error => {
                reject(error); // Handle any errors that may occur
            }
        );
    });
}

export default function SearchItem(
    {
        lat, lng, product
    }: SearchItemsProp
) {
    const geocoder = new google.maps.Geocoder();

    const locationAutoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const locationInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter()
    const [location, setLocation] = useState<string>("")
    const [localProduct, setLocalProduct] = useState<string | undefined>(product)

    const searchParams = new URLSearchParams(useSearchParams())

    async function reversedGeocode(lat: number, lng: number): Promise<string> {
        const latlng = {
            lat: lat,
            lng: lng,
        };

        if (!(lat && lng)) {
            throw "Both must be defined, or both undefined."
        }
        try {
            const { formatted_address } = (await geocoder.geocode({ location: latlng })).results[0] || {};
            return formatted_address || "No results found";
        } catch (e) {
            return "Geocoder failed due to: " + e;
        }
    }

    useEffect(() => {
        if (!locationInputRef.current) return;

        if (lat && lng) {
            (async () => {
                const address = await reversedGeocode(lat, lng)
                setLocation(address)
            })()
        }

        const options: google.maps.places.AutocompleteOptions = {
            fields: ["address_components", "geometry", "icon", "name"],
            types: ["establishment"],
        };

        locationAutoCompleteRef.current = new google.maps.places.Autocomplete(
            locationInputRef.current,
            options
        );

        locationAutoCompleteRef.current.addListener("place_changed", () => {


            const place = locationAutoCompleteRef.current?.getPlace();
            const address = place?.geometry?.location

            if (address) {
                setLocation(place.formatted_address as string);
                searchParams.set('lat', address.lat().toString())
                searchParams.set('lng', address.lng().toString())

                router.push(`/?${searchParams.toString()}`)
            }
        });

        return () => {
            if (locationAutoCompleteRef.current) {
                window.google.maps.event.clearInstanceListeners(locationAutoCompleteRef.current);
            }
        };
    }, []);

    return (
        <div className="border border-black px-10 py-7">
            <h1>Search for items</h1>
            <div className="mt-5 flex justify-between items-center">
                <div>
                    <label>Location: </label>
                    <input ref={locationInputRef}
                        onChange={e => setLocation(e.target.value)}
                        value={location} type="text" className="outline h-min mx-[1vw]" />
                    <button className="bg-cyan-200 px-[1vw]" onClick={async () => {
                        const currLocationCoor = await getCurrentLocation()
                        const currLocation = await reversedGeocode(currLocationCoor.lat, currLocationCoor.lng)
                        setLocation(currLocation)
                    }}>Use current location</button>
                </div>
                <div>
                    <label>Product: </label><input
                        value={localProduct} onChange={e => {
                            setLocalProduct(e.target.value)
                            if (e.target.value) {
                                searchParams.set('product', e.target.value)
                            }
                            else {
                                searchParams.delete('product')
                            }
                            router.push(`/?${searchParams.toString()}`)
                        }}
                        type="text" className="outline h-min" />
                </div>
                {/* <label>Amount: </label><input type="number" className="outline h-min" /> */}
            </div>
        </div>
    );
}
