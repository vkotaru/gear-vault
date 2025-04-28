import { useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import LoginForm from "@/components/auth/LoginForm";

export default function Login() {
  const [, setLocation] = useLocation();

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 hero-image">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-xl max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="font-bold text-3xl text-primary flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-7 w-7"
              >
                <path d="M17.5 17.5 14 20l-2.5-5.5L6 12l10-2.5L17.5 7l.5-3.5 3.5.5-2 10-2 3.5z" />
              </svg>
              GearShare
            </h1>
            <p className="text-neutral-600 mt-2">Your outdoor equipment management system</p>
          </div>
          
          <LoginForm />
          
          <div className="mt-4 text-center text-sm text-neutral-500">
            <p>Default login: username "admin" / password "password"</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
