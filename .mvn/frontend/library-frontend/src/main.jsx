import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { viVN } from "@mui/material/locale";
import "./index.css";
import App from "./App";
import AuthProvider from "./auth/AuthProvider";

const theme = createTheme({
  palette: { primary: { main: "#4f46e5" } },
  typography: { fontFamily: "Inter, system-ui, sans-serif", button: { textTransform: "none" } },
}, viVN);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
