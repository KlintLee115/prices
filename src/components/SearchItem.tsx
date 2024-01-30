"use client"

import { SearchItemsProp } from "@/lib/general";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useEffect, useState } from "react";

type FormattedSearchItemsProp = Omit<SearchItemsProp, "lat" | "lng" | "radius"> & {
    lat: number,
    lng: number,
    radius: number
}

const ProfileIcon = ({ pathName }: { pathName: string }) => (
    <Link href={pathName + "profile"}>
        <svg width="40px" height="40px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" stroke="#000CCCCCC" strokeWidth="4.8"> <path opacity="0.4" d="M12.1207 12.78C12.0507 12.77 11.9607 12.77 11.8807 12.78C10.1207 12.72 8.7207 11.28 8.7207 9.50998C8.7207 7.69998 10.1807 6.22998 12.0007 6.22998C13.8107 6.22998 15.2807 7.69998 15.2807 9.50998C15.2707 11.28 13.8807 12.72 12.1207 12.78Z" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> <path opacity="0.34" d="M18.7398 19.3801C16.9598 21.0101 14.5998 22.0001 11.9998 22.0001C9.39977 22.0001 7.03977 21.0101 5.25977 19.3801C5.35977 18.4401 5.95977 17.5201 7.02977 16.8001C9.76977 14.9801 14.2498 14.9801 16.9698 16.8001C18.0398 17.5201 18.6398 18.4401 18.7398 19.3801Z" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> </g><g id="SVGRepo_iconCarrier"> <path opacity="0.4" d="M12.1207 12.78C12.0507 12.77 11.9607 12.77 11.8807 12.78C10.1207 12.72 8.7207 11.28 8.7207 9.50998C8.7207 7.69998 10.1807 6.22998 12.0007 6.22998C13.8107 6.22998 15.2807 7.69998 15.2807 9.50998C15.2707 11.28 13.8807 12.72 12.1207 12.78Z" stroke="#000" strokeWidth="0.00024000000000000003" strokeLinecap="round" strokeLinejoin="round"></path> <path opacity="0.34" d="M18.7398 19.3801C16.9598 21.0101 14.5998 22.0001 11.9998 22.0001C9.39977 22.0001 7.03977 21.0101 5.25977 19.3801C5.35977 18.4401 5.95977 17.5201 7.02977 16.8001C9.76977 14.9801 14.2498 14.9801 16.9698 16.8001C18.0398 17.5201 18.6398 18.4401 18.7398 19.3801Z" stroke="#000" strokeWidth="0.00024000000000000003" strokeLinecap="round" strokeLinejoin="round"></path> <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#000" strokeWidth="0.00024000000000000003" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg>
    </Link>
)

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
            error => reject(error)
        );
    });
}

export default function SearchItem({
    lat, lng, radius, product
}: FormattedSearchItemsProp) {

    radius = isNaN(radius) ? 5 : radius

    const pathName = usePathname()

    const geocoder = new google.maps.Geocoder();
    const { data: session } = useSession()
    const username = session?.user?.name

    const locationAutoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const locationInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter()
    const [location, setLocation] = useState<string>('')

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

        if (!isNaN(lat) && !isNaN(lng)) {
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
            <div className="flex justify-between">
                <h1>Search for items</h1>
                <div className="flex items-center gap-3">
                    {username ? <h3>Signed in as {username}</h3> : <Link href="http://localhost:3000/api/auth/signin">Sign in with Google</Link>}
                    {<ProfileIcon pathName={pathName} />}
                </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-5 max-w-[700px] justify-between items-center">

                <div>
                    <label>Radius from location: </label>
                    <select onChange={e => {
                        searchParams.set('radius', e.target.value)
                        router.push(`?${searchParams.toString()}`)
                    }}
                        value={radius} className="outline h-min mx-[1vw]">
                        <option value={5}>5km</option>
                        <option value={10}>10km</option>
                        <option value={25}>25km</option>
                        <option value={50}>50km</option>
                    </select>

                </div>
                <div>
                    <label>Product: </label><input
                        value={product} onChange={e => {
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
                <div className="flex">
                    <label>Location: </label>
                    <input ref={locationInputRef}
                        onChange={e => setLocation(e.target.value)}
                        value={location} type="text" className="outline h-min mx-[1vw]" />
                    <button className="bg-cyan-200 px-[1vw]" onClick={async () => {
                        const currLocationCoor = await getCurrentLocation()
                        searchParams.set('lat', currLocationCoor.lat.toString())
                        searchParams.set('lng', currLocationCoor.lng.toString())
                        router.push(`/?${searchParams.toString()}`)

                        const currLocation = await reversedGeocode(currLocationCoor.lat, currLocationCoor.lng)
                        setLocation(currLocation)
                    }}>Use current location</button>
                </div>
            </div>
        </div>
    );
}
