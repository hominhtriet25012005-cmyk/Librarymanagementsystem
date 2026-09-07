export const isActive = (path, location) => {
  if (path === "/") {
    return location?.pathname === "/";
  }
  return location.pathname.startsWith(path);
};
