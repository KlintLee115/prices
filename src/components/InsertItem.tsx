"use client"

import { useRef, useEffect, FormEvent, useState } from "react";

export default function InsertItem() {
    const autoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

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
            const place = autoCompleteRef.current?.getPlace();

            setSelectedPlace(place!!)
        });

        return () => {
            if (autoCompleteRef.current) {
                window.google.maps.event.clearInstanceListeners(autoCompleteRef.current);
            }
        };
    }, []);


    const submitClicked = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const formData = new FormData(e.currentTarget)

        const products: string = formData.get('products') as string
        const date: string = formData.get('date') as string
        const price: number = parseFloat(formData.get('amount') as string)

        const addressComponents = selectedPlace!!.address_components;
        const formattedAddress: string = addressComponents!!.map(component => component.long_name).join(", ")

        const location = selectedPlace?.geometry?.location
        const lng = location?.lng()
        const lat = location?.lat()

        const response = await fetch('/api/', {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                products: products,
                price: price,
                dateStr: date,
                address: formattedAddress,
                lat: lat,
                lng: lng
            })
        })
        const data = await response.json()
    }

    return (
        <div className="max-w-[30vw] border border-black h-fit p-10 pb-5">
            <h1>Insert item</h1>
            <form onSubmit={submitClicked} className="mt-5 flex flex-wrap gap-2 items-center">
                <label>Location: </label>
                <input ref={inputRef} required type="text" className="outline h-min" />
                <label>Product: </label><input required name="products" type="text" className="outline h-min" />
                <label>Amount: </label><input required name="amount" type="number" step={0.01} className="outline h-min" />
                <label>Date purchased: </label><input required name="date" type="date" className="outline h-min" />
                <button type="submit" className="text-white bg-black px-4 py-1 rounded-lg">Submit</button>
            </form>
        </div>
    );
}
