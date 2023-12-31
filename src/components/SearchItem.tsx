"use client"

import { useRouter } from "next/navigation";
import { useRef, useEffect } from "react";

export default function SearchItem() {
    const autoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter()

    useEffect(() => {
        if (!inputRef.current) return;

        const options: google.maps.places.AutocompleteOptions = {
            fields: ["address_components", "geometry", "icon", "name"],
            types: ["establishment"],
        };

        autoCompleteRef.current = new google.maps.places.Autocomplete(
            inputRef.current,
            options
        );

        autoCompleteRef.current.addListener("place_changed", () => {

            const searchParams = new URLSearchParams()

            const place = autoCompleteRef.current?.getPlace();
            const address = place?.geometry?.location

            if (address) {
                searchParams.set('lat', address.lat().toString())
                searchParams.set('lng', address.lng().toString())

                router.push(`/?${searchParams.toString()}`)
            }
        });

        return () => {
            if (autoCompleteRef.current) {
                window.google.maps.event.clearInstanceListeners(autoCompleteRef.current);
            }
        };
    }, []);

    return (
        <div className="border border-black p-10 pb-5">
            <h1>Search for items</h1>
            <div className="mt-5 flex gap-4 items-center">
                <label>Location: </label>
                <input ref={inputRef} type="text" className="outline h-min" />
                <label>Product: </label><input type="text" className="outline h-min" />
                <label>Amount: </label><input type="number" className="outline h-min" />
            </div>
        </div>
    );
}
