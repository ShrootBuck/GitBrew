"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const LoadingSpinner = () => {
  const router = useRouter();

  // Redirect after 5 seconds
  // Hacky, I know
  useEffect(() => {
    const redirectTimeout = setTimeout(() => {
      router.push("/");
    }, 5000);

    return () => {
      clearTimeout(redirectTimeout);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#24292e] to-[#0d1117] text-white">
      <style jsx>{`
        .loader {
          width: 60px;
          aspect-ratio: 0.5;
          display: grid;
        }
        .loader:before {
          content: "";
          width: 30%;
          aspect-ratio: 1;
          border-radius: 50%;
          margin: auto auto 0;
          background: #6e5494;
          animation: l9-0 0.5s cubic-bezier(0, 800, 1, 800) infinite;
        }
        .loader:after {
          content: "";
          width: 100%;
          aspect-ratio: 1 / cos(30deg);
          margin: 0 auto auto;
          clip-path: polygon(50% -50%, 100% 50%, 50% 150%, 0 50%);
          background: #8a69b8;
          animation: l9-1 0.5s linear infinite;
        }
        @keyframes l9-0 {
          0%,
          2% {
            translate: 0 0%;
          }
          98%,
          to {
            translate: 0 -0.2%;
          }
        }
        @keyframes l9-1 {
          0%,
          5% {
            rotate: 0deg;
          }
          95%,
          to {
            rotate: -60deg;
          }
        }
      `}</style>
      <div className="mb-6 flex flex-row items-center">
        <Image src="/logo.png" alt="Logo" width={64} height={64} />
        <h1 className="text-2xl font-extrabold">
          Git <span className="text-[#6e5494]">Brew</span>
        </h1>
      </div>
      <div className="loader"></div>
      <p className="mt-6 text-lg font-medium text-white/80">
        Redirecting in 5 seconds...
      </p>
    </div>
  );
};

export default LoadingSpinner;
