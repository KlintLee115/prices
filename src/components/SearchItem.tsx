"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useEffect, useState } from "react";

type SearchItemsProp = {
    lat?: number;
    lng?: number;
    product?: string;
}

export default function SearchItem(
    {
        lat, lng, product
    }: SearchItemsProp
) {
    const locationAutoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const locationInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter()
    const [location, setLocation] = useState<string>("")
    const [localProduct, setLocalProduct] = useState<string | undefined>(product)

    const searchParams = new URLSearchParams(useSearchParams())

    async function reversedGeocodeLatLng(
        geocoder: google.maps.Geocoder,
    ): Promise<string> {
        const latlng = {
            lat: lat as number,
            lng: lng as number,
        };

        if (!(lat && lng)) {
            throw "Both must be defined, or both are undefined."
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

        const geocoder = new google.maps.Geocoder();

        if (lat && lng) {
            (async () => {
                const address = await reversedGeocodeLatLng(geocoder)
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
        <div className="border border-black p-10 pb-5">
            <h1>Search for items</h1>
            <div className="mt-5 flex gap-4 items-center">
                <label>Location: </label>
                <input ref={locationInputRef}
                    onChange={e => setLocation(e.target.value)}
                    value={location} type="text" className="outline h-min" />
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
                {/* <label>Amount: </label><input type="number" className="outline h-min" /> */}
            </div>
        </div>
    );
}
