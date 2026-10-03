import React, { createContext, useContext, useEffect, useState } from "react";








const RouterContext = createContext({
  pathname: "/",
  search: "",
  searchParams: new URLSearchParams(),
  navigate: () => {}
});

export function RouterProvider({ children }) {
  const [currentUrl, setCurrentUrl] = useState(() => ({
    pathname: window.location.pathname || "/",
    search: window.location.search || ""
  }));

  useEffect(() => {
    const onPopState = () => {
      setCurrentUrl({
        pathname: window.location.pathname || "/",
        search: window.location.search || ""
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (to, options) => {
    try {
      const url = new URL(to, window.location.origin);
      const newPath = url.pathname;
      const newSearch = url.search;

      if (options?.replace) {
        window.history.replaceState(null, "", to);
      } else {
        window.history.pushState(null, "", to);
      }

      setCurrentUrl({
        pathname: newPath,
        search: newSearch
      });

      // Scroll to top on normal page transitions unless hash anchor is present
      if (!url.hash) {
        window.scrollTo(0, 0);
      } else {
        const el = document.getElementById(url.hash.slice(1));
        if (el) el.scrollIntoView();
      }
    } catch {
      // Fallback for relative paths without origin
      if (options?.replace) {
        window.history.replaceState(null, "", to);
      } else {
        window.history.pushState(null, "", to);
      }
      const [p, s] = to.split("?");
      setCurrentUrl({
        pathname: p || "/",
        search: s ? `?${s}` : ""
      });
      window.scrollTo(0, 0);
    }
  };

  const searchParams = new URLSearchParams(currentUrl.search);

  return (
    <RouterContext.Provider
      value={{
        pathname: currentUrl.pathname,
        search: currentUrl.search,
        searchParams,
        navigate
      }}>
      
      {children}
    </RouterContext.Provider>);

}

export function useRouter() {
  return useContext(RouterContext);
}






export function Link({ href, replace, children, className, onClick, ...rest }) {
  const { pathname, navigate } = useRouter();
  const isActive = pathname === href || href !== "/" && pathname.startsWith(href);

  const handleClick = (e) => {
    if (onClick) onClick(e);
    // Don't intercept if external, modified click, or right click
    if (
    e.defaultPrevented ||
    e.button !== 0 ||
    e.metaKey ||
    e.altKey ||
    e.ctrlKey ||
    e.shiftKey ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:"))
    {
      return;
    }
    e.preventDefault();
    navigate(href, { replace });
  };

  return (
    <a
      href={href}
      className={`${className || ""} ${isActive ? "active" : ""}`}
      onClick={handleClick}
      data-active={isActive ? "true" : undefined}
      {...rest}>
      
      {children}
    </a>);

}