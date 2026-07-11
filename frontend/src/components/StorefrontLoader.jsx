import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useLocation } from "react-router-dom";
import "./css/StorefrontLoader.css";

const STOREFRONT_LOADER_SRC =
  "https://lottie.host/651a8a0d-842e-4a4e-b144-82d60252a233/cLGmf7mHTC.lottie";

const NON_STOREFRONT_PREFIXES = [
  "/admin",
  "/manager",
  "/mechanic",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const isStorefrontPath = (pathname) =>
  !NON_STOREFRONT_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export default function StorefrontLoader() {
  return (
    <div className="storefront-loader" aria-label="Loading storefront" role="status">
      <div className="storefront-loader-art">
        <DotLottieReact src={STOREFRONT_LOADER_SRC} loop autoplay />
      </div>
    </div>
  );
}

export function StorefrontLoaderGate() {
  const location = useLocation();
  const [visible, setVisible] = useState(() => isStorefrontPath(location.pathname));

  useEffect(() => {
    if (!isStorefrontPath(location.pathname)) {
      setVisible(false);
      document.documentElement.classList.remove("show-storefront-loader");
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setVisible(false);
      document.documentElement.classList.remove("show-storefront-loader");
    }, 2000);

    return () => {
      window.clearTimeout(timer);
      document.documentElement.classList.remove("show-storefront-loader");
    };
    // Only run on the initial app mount, so client-side route changes do not show the loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return visible ? <StorefrontLoader /> : null;
}
