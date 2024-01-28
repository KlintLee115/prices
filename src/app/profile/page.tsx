"use client"

import { BasePricesResponseType, FormattedPricesResponseType, Icons, SessionInfo, URL_Endpoints, handleFeedback } from "@/lib/general"
import { useEffect, useState } from "react"

type BaseUserRelatedPostsType = {
    likes: BasePricesResponseType[],
    dislikes: BasePricesResponseType[],
    posts: BasePricesResponseType[]
}

enum FeedbackType {
    Like = "Like", Dislike = "Dislike"
}

const fetchData = async function <T>(url: string, errorMessage: string): Promise<T | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(errorMessage);
        return await response.json() as T;
    } catch (error: any) {
        console.error(`Error ${errorMessage}:`, error.message);
        throw error
    }
};

export default function ProfilePage() {

    const [prices, setPrices] = useState<Map<number, FormattedPricesResponseType>>(new Map())

    type UserInfoType = {
        dislikes: number[],
        email: string,
        likes: number[],
        posts: number[]
    }

    const processPosts = (posts: BasePricesResponseType[], userFeedbacks: UserInfoType | null, isLiked = false, isDisliked = false): Map<number, FormattedPricesResponseType> => {
        const processedPosts = new Map<number, FormattedPricesResponseType>();

        posts.forEach(post => {
            processedPosts.set(post.id, {
                ...post,
                price: parseFloat(post.price),
                lat: parseFloat(post.lat),
                lng: parseFloat(post.lng),
                likes: parseInt(post.likes),
                dislikes: parseInt(post.dislikes),
                isLiked: isLiked ? isLiked : (userFeedbacks?.likes || []).includes(post.id),
                isDisliked: isDisliked ? isDisliked : (userFeedbacks?.dislikes || []).includes(post.id),
            });
        });

        return processedPosts;
    };

    const fetchUserFeedbacks = async () => {
        const url = `${URL_Endpoints.BASE_URL}${URL_Endpoints.USER_INFO_ENDPOINT}?email=${SessionInfo.get("Email")}`;
        return await fetchData<UserInfoType>(url, "fetching user feedbacks");
    };

    const fetchUserRelatedPosts = async (userFeedbacks: UserInfoType) => {
        const endpoint = `${URL_Endpoints.BASE_URL}${URL_Endpoints.GET_POSTS_ENDPOINT}?likes=${userFeedbacks.likes.join(',')}&dislikes=${userFeedbacks.dislikes.join(',')}&posts=${userFeedbacks.posts.join(',')}`;
        return await fetchData<BaseUserRelatedPostsType>(endpoint, "fetching user related posts");
    };


    useEffect(() => {
        (async () => {
            const userFeedbacks = await fetchUserFeedbacks();
            if (!userFeedbacks) return;

            const userRelatedPosts = await fetchUserRelatedPosts(userFeedbacks);
            if (!userRelatedPosts) return;

            const likedPosts = userRelatedPosts.likes;
            const dislikedPosts = userRelatedPosts.dislikes;
            const userPosts = userRelatedPosts.posts;

            const newMap = new Map<number, FormattedPricesResponseType>();

            processPosts(likedPosts, userFeedbacks, true, false).forEach((value, key) => newMap.set(key, value));
            processPosts(dislikedPosts, userFeedbacks, false, true).forEach((value, key) => newMap.set(key, value));
            processPosts(userPosts, userFeedbacks).forEach((value, key) => newMap.set(key, value));

            setPrices(newMap);
        })()
    }, [])

    return <div className="m-0 ml-80 mr-80">

        <div className="border-black border-b-2 text-center pt-2 pb-2 flex gap-6 items-center">
            <svg width="32px" height="32px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#000000" d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"></path><path fill="#000000" d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"></path></g></svg>
            <p>{SessionInfo.get("Email")}</p>
        </div>
        <p className="mt-5 font-bold">Posts</p>
        <PostsWidget ids={Array.from(prices.keys()).filter(priceKey => prices.get(priceKey)!!.by === SessionInfo.get("Email"))} />
        <p className="mt-5 font-bold">Likes</p>
        <PostsWidget ids={Array.from(prices.keys()).filter(priceKey => prices.get(priceKey)!!.isLiked)} />
        <p className="mt-5 font-bold">Dislikes</p>
        <PostsWidget ids={Array.from(prices.keys()).filter(priceKey => prices.get(priceKey)!!.isDisliked)} />

    </div>

    function PostsWidget({ ids }: { ids: number[] }) {
        return ids.map(id => <PriceCard item={prices.get(id) as FormattedPricesResponseType} id={id} key={id} />)
    }

    function PriceCard({ item, id }: {
        item: FormattedPricesResponseType,
        id: number,
    }) {

        const { product, price, address, isLiked, isDisliked, likes, dislikes } = item

        function handleFeedbackFunc(feedbackType: FeedbackType) {
            handleFeedback({ id, isLiked, isDisliked, prices, setPrices, feedbackType })
        }

        return <div className="border border-black h-fit py-[1vh] px-[3vw] flex bg-cyan-100">
            <div>
                <h3>Item: {product}</h3>
                <h3>Price: {price}</h3>
                <h3>Address: {address}</h3>
            </div>
            <div className='relative'>
                <div className='w-14'>
                    {
                        item.isLiked ?
                            <Icons.BLACK_LIKE_ICON onClick={() => handleFeedbackFunc(FeedbackType.Like)} />
                            : <Icons.WHITE_LIKE_ICON onClick={() => handleFeedbackFunc(FeedbackType.Like)} />
                    }
                    {likes}
                </div>
                <div className='absolute bottom-0 w-14'>
                    {
                        isDisliked ?
                            <Icons.BLACK_DISLIKE_ICON onClick={() => handleFeedbackFunc(FeedbackType.Dislike)} />
                            : <Icons.WHITE_DISLIKE_ICON onClick={() => handleFeedbackFunc(FeedbackType.Dislike)}
                            />
                    }
                    {dislikes}
                </div>
            </div>
        </div>
    }
}
