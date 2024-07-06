'use client';
import { AuthenticationResult } from "@azure/msal-node"
import axios from "axios"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function Home() {
    useEffect(() => {
        const signin = async() => {
            try {
                const { data } = await axios.get('/api/auth/signin');
                window.location.href = data.redirect_url;
                // console.log(data.redirect_url);
            } catch (error) {
                console.error('Error during sign-in:', error);
            }
        };
        signin();
    }, []);

    return (
        <main>
            <p>リダイレクト中...</p>
        </main>
    );
}